import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Configuration for Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC3sK6Leut_jShHyb_kN0bIPWXBrtKWwOI",
  authDomain: "chrome-polygon-k83b3.firebaseapp.com",
  projectId: "chrome-polygon-k83b3",
  storageBucket: "chrome-polygon-k83b3.firebasestorage.app",
  messagingSenderId: "713255735794",
  appId: "1:713255735794:web:0860babe826ae443245b6b"
};

// Custom Firestore Database ID from our config
const databaseId = "ai-studio-a27d6130-c443-4832-8d80-83d1012e39bc";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore targeting the custom databaseId with forced long polling for connectivity
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Initialize Cloud Storage
const storage = getStorage(app);

// Initialize Auth
const auth = getAuth(app);

export { app, db, storage, auth };


