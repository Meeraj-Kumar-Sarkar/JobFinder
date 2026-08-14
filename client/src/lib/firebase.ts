import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error);
  // Fallback mock auth object if Firebase fails to initialize
  app = getApps().length ? getApp() : initializeApp({ apiKey: "demo-api-key", projectId: "demo-app" });
  auth = getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
export { app, auth };
