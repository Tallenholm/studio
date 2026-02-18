
'use client';

import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

// Re-export universal initializers
export { initializeFirebase, isFirebaseConfigured, uploadFile } from './init';

// Client-side hooks and providers
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// Client-side specific functions
import { initializeFirebase } from './init';

export async function requestNotificationPermission() {
  const { messaging } = initializeFirebase();
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
