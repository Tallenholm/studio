
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT: This file cannot use environment variables.
// You must copy your Firebase project's configuration here manually.
const firebaseConfig = {
  apiKey: "AIzaSyAUV-T8mKonfudqI8dsvQiEeScOjwKRhqE",
  authDomain: "fleet-check-633wb.firebaseapp.com",
  projectId: "fleet-check-633wb",
  storageBucket: "fleet-check-633wb.firebasestorage.app",
  messagingSenderId: "540298110924",
  appId: "1:540298110924:web:90febf010a4f90b8a3df69",
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico', // Optional: Use a suitable icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
