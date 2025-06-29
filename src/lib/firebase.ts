
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

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

// Check if all necessary Firebase config keys are present
export const isFirebaseConfigured = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

if (isFirebaseConfigured) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
    }
  } else {
    app = getApp();
  }

  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.error("Failed to initialize Firebase Messaging", e);
      }
    }
  }
} else {
    console.warn("Firebase config is not fully provided in environment variables. Firebase services are disabled.");
}

export async function uploadFile(file: File, path: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && messaging) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (token) {
          console.log('Firebase Cloud Messaging token: ', token);
          // Here you would typically send the token to your server to store it.
          return token;
        } else {
          console.log('No registration token available. Request permission to generate one.');
          return null;
        }
      } else {
        console.warn('Notification permission denied.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while getting the token. ', error);
      return null;
    }
  }
  return null;
}

export { app, auth, db, storage, messaging };
