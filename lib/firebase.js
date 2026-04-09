import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) return null;
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
};

export { firebaseConfig, getFirebaseApp, getFirebaseAuth, isFirebaseConfigured };
