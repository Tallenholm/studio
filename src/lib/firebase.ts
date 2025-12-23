// This file is the public API for the Firebase module.
// It is used by the rest of the application to access Firebase services.

'use client';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

// Your web app's Firebase configuration
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

export const isFirebaseConfigured = !!firebaseConfig.projectId;

/**
 * Initializes Firebase services if they haven't been already.
 * Safe to call on both server and client.
 */
export function initializeFirebase() {
  if (isFirebaseConfigured && !getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
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
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
    }
  } else if (getApps().length) {
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
      console.warn("Firebase config is not fully provided in environment variables. Firebase services are disabled.");
  }
  
  return { app, auth, db, storage };
}

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage to upload the file to.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
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

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && messaging) {
    const currentPermission = Notification.permission;
    
    if (currentPermission === 'granted') {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token) {
          console.log('Firebase Cloud Messaging token already available: ', token);
          return token;
        }
    }
      
    if (currentPermission === 'denied') {
        console.warn('Notification permission was previously denied.');
        return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (token) {
          console.log('Firebase Cloud Messaging token obtained: ', token);
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
