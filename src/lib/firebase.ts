import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase safely (avoid multiple initializations)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Test Firestore connection on boot as recommended
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore client is in offline mode.');
      return false;
    }
    // Any permission error or doc not found is still a successful network handshake
    return true;
  }
}
