import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import { env } from "./env.js";

const hasFirebaseConfig = Boolean(
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_PRIVATE_KEY
);

if (hasFirebaseConfig && !getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      databaseURL: env.FIREBASE_DATABASE_URL || undefined,
    });
    console.log("[Firebase] Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.warn("[Firebase] Could not initialize Firebase Admin SDK:", err.message);
  }
} else if (!hasFirebaseConfig) {
  console.log("[Firebase] No Firebase Admin credentials found — running in standalone MongoDB mode.");
}

export const isFirebaseConfigured = Boolean(getApps().length);

export const firebaseAuth = isFirebaseConfigured
  ? getAuth()
  : {
      verifyIdToken: async () => {
        throw new Error("Firebase Auth is not configured on this server");
      },
      createUser: async () => {
        throw new Error("Firebase Auth is not configured on this server");
      },
      getUserByEmail: async () => {
        throw new Error("Firebase Auth is not configured on this server");
      },
    };

export const firebaseDB = isFirebaseConfigured ? getDatabase() : null;

export const firestore = isFirebaseConfigured
  ? getFirestore()
  : {
      collection: () => ({
        doc: () => ({
          set: async () => {},
          get: async () => ({ exists: false, data: () => null }),
        }),
      }),
    };
