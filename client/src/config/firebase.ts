import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
} from "firebase/auth";

// Strictly read Firebase client credentials from environment variables.
// NEVER hardcode API keys or project IDs in source code.
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account",
    });
  } catch (err) {
    console.warn("[Firebase] Client initialization failed:", err);
  }
}

export const firebaseApp = app;
export const firebaseAuth = auth;

export interface GoogleAuthPayload {
  idToken: string;
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

export async function signInWithGooglePopup(): Promise<GoogleAuthPayload> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error(
      "Google Sign-In is not configured. Please configure the VITE_FIREBASE_* environment variables in your environment."
    );
  }

  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const idToken = await fbUser.getIdToken();

  return {
    idToken,
    uid: fbUser.uid,
    email: fbUser.email || "",
    name:
      fbUser.displayName ||
      (fbUser.email ? fbUser.email.split("@")[0] : "Google User"),
    photoURL: fbUser.photoURL || undefined,
  };
}

export async function signOutFirebase(): Promise<void> {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch {
    // Ignore sign-out errors
  }
}
