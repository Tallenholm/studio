
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '@/lib/firebase-initialize';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';

const { auth, db, isFirebaseConfigured } = initializeFirebase();

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
          const usersCollectionRef = collection(db, 'users');
          const q = query(usersCollectionRef, limit(1));
          const existingUsersSnapshot = await getDocs(q);
          const isFirstUser = existingUsersSnapshot.empty;
          const role: UserRole = isFirstUser ? 'owner' : 'employee';
          
          const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User';
          
          const newUserProfile: User = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: name,
              role: role,
          };

          await setDoc(userDocRef, newUserProfile);
          setUser(newUserProfile);
        } else {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
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
