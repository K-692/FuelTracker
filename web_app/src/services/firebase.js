/**
 * firebase.js
 * Firebase initialization, Google Authentication, and Firestore client.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'fueltracker_firebase_config';

// Retrieves the active Firebase configuration object
export function getFirebaseConfig() {
  // 1. Check custom localStorage overrides first
  try {
    const customConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse custom Firebase config:', e);
  }

  // 2. Check Vite environment variables (injected via .env or GitHub Actions secrets)
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
  }

  return null;
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;
let googleProvider = null;

export function initializeFirebaseServices() {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey) {
    return { isConfigured: false, app: null, auth: null, db: null };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }

    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Enable offline persistence in browser if possible
    try {
      enableIndexedDbPersistence(dbInstance).catch((err) => {
        if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
          // Tab concurrency or unsupported browser
        }
      });
    } catch (_) {}

    return {
      isConfigured: true,
      app: appInstance,
      auth: authInstance,
      db: dbInstance,
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { isConfigured: false, app: null, auth: null, db: null, error };
  }
}

// Initial setup
initializeFirebaseServices();

/**
 * Checks if Firebase is actively configured with valid keys.
 */
export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

/**
 * Initiates Google Sign-In with popup.
 */
export async function loginWithGoogle() {
  const services = initializeFirebaseServices();
  if (!services.auth) {
    throw new Error('Firebase Authentication is not ready.');
  }

  try {
    const result = await signInWithPopup(services.auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Signs out the current user.
 */
export async function logoutUser() {
  if (authInstance) {
    await fbSignOut(authInstance);
  }
}

/**
 * Subscribes to Firebase Auth state changes.
 */
export function subscribeToAuth(callback) {
  const services = initializeFirebaseServices();
  if (!services.auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(services.auth, (user) => {
    callback(user);
  });
}

/**
 * Saves custom Firebase credentials into localStorage and re-initializes.
 */
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    return initializeFirebaseServices();
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    throw e;
  }
}

/**
 * Clears custom Firebase configuration.
 */
export function clearFirebaseConfig() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  appInstance = null;
  authInstance = null;
  dbInstance = null;
}

export function getDb() {
  if (!dbInstance) {
    initializeFirebaseServices();
  }
  return dbInstance;
}

export function getAuthService() {
  if (!authInstance) {
    initializeFirebaseServices();
  }
  return authInstance;
}
