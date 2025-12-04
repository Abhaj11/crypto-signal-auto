// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIT2XZUqmDVyPkwlw6eOfpWtFZSK9RQZA",
  authDomain: "giant-oracle-eb1c0.firebaseapp.com",
  projectId: "giant-oracle-eb1c0",
  storageBucket: "giant-oracle-eb1c0.firebasestorage.app",
  messagingSenderId: "213340913244",
  appId: "1:213340913244:web:4fe5534ee2c47425953099",
  measurementId: "G-SDNN4597TE"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


export { app, auth, db };
