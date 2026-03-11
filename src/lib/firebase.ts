import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBPEYX3OqL7kF8U3Donod4tQpKkryG4ERQ",
  authDomain: "applemeninas-app.firebaseapp.com",
  projectId: "applemeninas-app",
  storageBucket: "applemeninas-app.firebasestorage.app",
  messagingSenderId: "775059826620",
  appId: "1:775059826620:web:4a628eec655c740257edb9",
  measurementId: "G-PB7T21H7NG",
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
