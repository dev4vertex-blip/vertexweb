import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore with specific database ID from config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

/**
 * Validate connection to Firestore upon application boot
 * Required constraint by Firebase integration skill
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[VERTEX Firebase] Firestore connection offline. Please check network and Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export {
  app,
  auth,
  db,
  firebaseConfig,
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
};
