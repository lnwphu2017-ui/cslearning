// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgIwX3DwDhwFaTZEbGBzFeX46ZZnrgeV0",
  authDomain: "cslearning-53980.firebaseapp.com",
  projectId: "cslearning-53980",
  storageBucket: "cslearning-53980.firebasestorage.app",
  messagingSenderId: "142497003275",
  appId: "1:142497003275:web:0ec680eee0264c530bd40e",
  measurementId: "G-KTP42M88JF"
};

// Initialize Firebase (SSR Safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
