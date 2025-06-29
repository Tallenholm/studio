'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';
import { loadUsers } from '@/lib/localStorageService'; // For seeding/fallback

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  role: UserRole | 'guest';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isFirebaseConfigured: false,
  login: async () => {},
  logout: async () => {},
  role: 'guest',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This ensures default data is seeded if it doesn't exist
    loadUsers();

    if (!isFirebaseConfigured) {
        console.warn("Firebase not initialized, auth will not work.");
        setIsLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their custom data from Firestore
        const userDocRef = doc(db!, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name,
            role: userData.role,
          });
        } else {
          // Fallback for when a Firestore user document doesn't exist yet.
          // This is common during initial setup. We'll use the local seed data.
          console.warn(`No user document found in Firestore for UID: ${firebaseUser.uid}. Falling back to local data. Please create a 'users' collection in Firestore and add a document for this user.`);
          const localUsers = loadUsers();
          const localUser = localUsers.find(u => u.email === firebaseUser.email);
          
          if (localUser) {
            setUser({
              ...localUser,
              uid: firebaseUser.uid, // Use the real Firebase UID
            });
          } else {
            // If user is not even in the local data, then they can't log in.
            console.error(`User with email ${firebaseUser.email} not found in Firestore or local seed data.`);
            setUser(null);
          }
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured. Please add your project credentials to the .env file.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase is not configured. Please add your project credentials to the .env file.");
    await signOut(auth);
  };

  const value = {
    user,
    isLoading,
    isFirebaseConfigured,
    login,
    logout,
    role: user?.role || 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
