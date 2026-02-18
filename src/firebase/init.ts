import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let messaging: Messaging | null = null;

export const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

export function initializeFirebase() {
  if (isFirebaseConfigured && !getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      storage = getStorage(app);

      if (typeof window !== 'undefined') {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager({}),
          }),
        });
      } else {
        db = getFirestore(app);
      }

      if (typeof window !== 'undefined') {
        try {
          messaging = getMessaging(app);
        } catch (e) {
          console.error("Failed to initialize Firebase Messaging", e);
        }
      }

    } catch (e) {
      console.error("Failed to initialize Firebase", e);
    }
  } else if (getApps().length) {
    // This block handles cases like Hot Module Replacement in development
    // where the app might already be initialized.
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined' && !messaging) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.error("Failed to re-initialize Firebase Messaging", e);
      }
    }
  }

  if (!isFirebaseConfigured) {
    console.warn("Firebase config is not fully provided. Firebase services are disabled.");
  }

  return { app, auth, db, storage, messaging };
}

export async function uploadFile(file: File, path: string): Promise<string> {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { storage } = initializeFirebase();

  if (!storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
