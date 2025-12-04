
import { doc, updateDoc, getDoc, increment, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as CryptoJS from 'crypto-js';
import type { User } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-that-is-long-and-secure';

if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'default-secret-key-that-is-long-and-secure') {
    console.warn("WARNING: Default encryption key is used in production. Please set a strong NEXT_PUBLIC_ENCRYPTION_KEY in your environment variables.");
}

// Function to encrypt data
export const encryptData = (text: string): string => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

// Function to decrypt data
export const decryptData = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  if (!originalText) {
      throw new Error("Decryption failed. Check the encryption key or data integrity.");
  }
  return originalText;
};

export function createUserProfileDocument(user: User) {
  const userDocRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    name: 'Pro Trader',
    email: user.email,
    portfolio: [
      { asset: 'BTC', value: 45000 },
      { asset: 'ETH', value: 25000 },
      { asset: 'SOL', value: 15000 },
      { asset: 'ADA', value: 8000 },
      { asset: 'DOT', value: 5000 },
      { asset: 'Other', value: 2000 },
    ],
    createdAt: serverTimestamp(),
    subscriptionTier: 'FREE',
    walletBalance: 25.0,
    isAutoTradeEnabled: false,
    autoTradeAmount: 100,
    autoTradeRiskLevel: 'medium',
  };

  setDoc(userDocRef, userData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'create',
      requestResourceData: userData,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw the original server error so the calling function knows it failed
    throw serverError;
  });
}


// Function to update API keys for a user
export const updateApiKeys = async (userId: string, exchange: string, apiKey: string, apiSecret: string) => {
    if (!userId || !exchange || !apiKey || !apiSecret) {
        throw new Error("Missing required parameters for updating API keys.");
    }
    const userDocRef = doc(db, "users", userId);

    const encryptedApiKey = encryptData(apiKey);
    const encryptedApiSecret = encryptData(apiSecret);

    const dataToUpdate = {
        [`apiKeys.${exchange}`]: {
            apiKey: encryptedApiKey,
            apiSecret: encryptedApiSecret,
            updatedAt: new Date(),
        }
    };
    
    updateDoc(userDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
};


// Function to delete API keys for a user
export const deleteApiKeys = async (userId: string, exchange: string) => {
    if (!userId || !exchange) {
        throw new Error("Missing required parameters for deleting API keys.");
    }

    const userDocRef = doc(db, "users", userId);
    
    const dataToUpdate = {
        [`apiKeys.${exchange}`]: {}
    };

    updateDoc(userDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
};

// Function to update auto-trade settings
export const updateAutoTradeSettings = async (userId: string, settings: { isAutoTradeEnabled: boolean; autoTradeAmount: number; autoTradeRiskLevel: string; }) => {
    if (!userId || !settings) {
        throw new Error("Missing required parameters for updating auto-trade settings.");
    }
    const userDocRef = doc(db, "users", userId);

    const dataToUpdate = {
        isAutoTradeEnabled: settings.isAutoTradeEnabled,
        autoTradeAmount: Number(settings.autoTradeAmount),
        autoTradeRiskLevel: settings.autoTradeRiskLevel
    };

    updateDoc(userDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
};

// Function to update user subscription tier
export const updateUserSubscription = async (userId: string, tier: 'TRADER' | 'PRO' | 'VIP') => {
    if (!userId || !tier) {
        throw new Error("Missing required parameters for updating subscription.");
    }
    const userDocRef = doc(db, "users", userId);
    const dataToUpdate = { subscriptionTier: tier };

    updateDoc(userDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
};

// **FIXED** Function to update user wallet balance
export const updateUserBalance = async (userId: string, amount: number) => {
    if (!userId || typeof amount !== 'number') {
        throw new Error("Invalid parameters for updating balance.");
    }
    const userDocRef = doc(db, "users", userId);
    
    // This function now exclusively uses increment.
    // To add funds (deposit), pass a positive `amount`.
    // To deduct funds (payment or profit share), pass a negative `amount`.
    const dataToUpdate = { walletBalance: increment(amount) };
    updateDoc(userDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { walletBalance: `increment(${amount})`},
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
};
    

    
