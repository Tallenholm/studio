'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  role: UserRole | 'guest';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isFirebaseConfigured: false,
  login: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  role: 'guest',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
        console.warn("Firebase not initialized, auth will not work.");
        setIsLoading(false);
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // If the user doc doesn't exist, create it. This is the source of truth.
          const usersCollectionRef = collection(db, 'users');
          const q = query(usersCollectionRef, limit(1));
          const existingUsersSnapshot = await getDocs(q);
          const isFirstUser = existingUsersSnapshot.empty;
          const role: UserRole = isFirstUser ? 'owner' : 'employee';
          const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User';
          const nameCapitalized = name.charAt(0).toUpperCase() + name.slice(1);
          
          const newUserProfile = {
              email: firebaseUser.email,
              name: nameCapitalized,
              role: role,
          };

          await setDoc(userDocRef, newUserProfile);
          userDoc = await getDoc(userDocRef); // Re-fetch the doc after creating it
        }

        const userData = userDoc.data();
        if (userData) {
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name,
            role: userData.role,
          });
        } else {
            // This should ideally not be reached anymore.
            console.error(`Could not retrieve user data for UID ${firebaseUser.uid} even after creation attempt.`);
            await signOut(auth);
            setUser(null);
        }

      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase is not configured. Please add your project credentials to the .env file.");
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase is not configured.");
    }
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        console.error("Google Sign-In Error: ", error);
        throw new Error("Could not sign in with Google. Please try again.");
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized.");
    await signOut(auth);
  };

  const value = {
    user,
    isLoading,
    isFirebaseConfigured,
    login,
    signInWithGoogle,
    logout,
    role: user?.role || 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
