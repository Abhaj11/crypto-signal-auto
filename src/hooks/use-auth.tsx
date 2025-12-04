

"use client";

import { auth, db } from "@/lib/firebase";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, onSnapshot, DocumentData, updateDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createUserProfileDocument } from '@/lib/user-profile';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

interface PortfolioItem {
  asset: string;
  value: number;
}
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  portfolio: PortfolioItem[];
  createdAt: Date;
  subscriptionTier: 'FREE' | 'TRADER' | 'PRO' | 'VIP';
  walletBalance: number; // Add wallet balance
  apiKeys?: {
    binance?: {
      apiKey: string;
      apiSecret: string;
    };
  };
  isAutoTradeEnabled?: boolean;
  autoTradeAmount?: number;
  autoTradeRiskLevel?: 'low' | 'medium' | 'high';
}
interface AuthContextType {
  user: User | null | undefined; // undefined: loading, null: no user
  userProfile: UserProfile | null | undefined;
  decryptedApiKeys?: { binance?: { apiKey: string; apiSecret: string } };
  loading: boolean;
  error: string | null;
  signUp: (email: string, pass: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  updateUserPassword: (currentPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null | undefined>(undefined);
  const [decryptedApiKeys, setDecryptedApiKeys] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Log the ID token to the console upon successful login
        user.getIdToken(true).then(idToken => {
            // console.log("Here is your ID Token:", idToken);
        }).catch(error => {
            console.error("Error getting ID token:", error);
        });

        const userDocRef = doc(db, "users", user.uid);
        const unsubFromDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profileData = doc.data() as UserProfile;
            setUserProfile(profileData);
            if (profileData.apiKeys?.binance?.apiKey) {
              setDecryptedApiKeys({ binance: { apiKey: '******', apiSecret: '******' } });
            } else {
              setDecryptedApiKeys(null);
            }
          } else {
            setUserProfile(null);
            setDecryptedApiKeys(null);
          }
          setLoading(false);
        }, (err) => {
            console.error("Firestore snapshot error:", err);
            setError("Failed to load user profile. Please check your connection or permissions.");
            setUserProfile(null);
            setLoading(false);
        });
        return () => unsubFromDoc();
      } else {
        setUserProfile(null);
        setDecryptedApiKeys(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfileDocument(userCredential.user);
    } catch (err: any) {
        setError(err.message);
        throw err; // Re-throw to be caught by the calling component if needed
    } finally {
        setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
       if (err.code === 'auth/invalid-credential') {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserProfileName = async (name: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated.");
    const userDocRef = doc(db, "users", user.uid);
    const dataToUpdate = { name };

    await updateProfile(user, { displayName: name });
    
    updateDoc(userDocRef, dataToUpdate)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        // We don't re-throw here to prevent unhandled promise rejections in the UI,
        // as the error is now handled globally by the listener.
      });
  };
  
  const updateUserPassword = async (currentPass: string, newPass: string): Promise<void> => {
     if (!user || !user.email) throw new Error("User not authenticated properly.");
     
     try {
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);
     } catch (err: any) {
        console.error("Error updating password:", err);
        // Provide a more user-friendly error message
        if (err.code === 'auth/wrong-password') {
            throw new Error("The current password you entered is incorrect.");
        }
        throw new Error("Failed to update password. Please try again.");
     }
  };


  const value = { user, userProfile, decryptedApiKeys, loading, error, signUp, signIn, signOut, updateUserProfileName, updateUserPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
