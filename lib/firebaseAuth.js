import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

const assertFirebaseReady = () => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase auth is not configured. Add Firebase env vars in .env.local.");
  }
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase auth initialization failed.");
  }
  return auth;
};

export const signInWithGoogle = async () => {
  const auth = assertFirebaseReady();
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export const signInWithGithub = async () => {
  const auth = assertFirebaseReady();
  try {
    return await signInWithPopup(auth, githubProvider);
  } catch (error) {
    if (error?.code === "auth/popup-blocked" || error?.code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, githubProvider);
      return null;
    }
    throw error;
  }
};

export const logoutFirebase = async () => {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
};

export const subscribeAuth = (callback) => {
  const auth = getFirebaseAuth();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

export const resolveRedirectAuth = async () => {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return getRedirectResult(auth);
};
