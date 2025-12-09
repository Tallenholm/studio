
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';
import { initializeFirebase } from './firebase-initialize';

// Get the initialized services
const { storage, messaging } = initializeFirebase();

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

export { storage, messaging };
