
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  if (!firebaseConfig.projectId) {
    console.warn("Firebase config not found. Push notifications will not be initialized.");
    app = {} as FirebaseApp;
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApp();
}

const messaging = (typeof window !== 'undefined' && app.options.projectId) ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.log("Messaging not supported or initialized.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      console.log('FCM Token:', token);
      // Here you would typically send the token to your backend to store it against the user
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while getting notification permission.', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise<{}>((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });


export { app, messaging };
