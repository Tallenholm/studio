
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isFirebaseConfigured, initializeFirebase } from '@/lib/firebase-initialize';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';
import { FirebaseContext } from '@/firebase/provider';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  role: UserRole | 'guest';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isFirebaseConfigured: false,
  login: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  role: 'guest',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firebaseContext = useContext(FirebaseContext);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseContext || !firebaseContext.auth || !firebaseContext.firestore) {
        console.warn("Firebase not initialized, auth will not work.");
        setIsLoading(false);
        return;
    }
    
    const { auth, firestore } = firebaseContext;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          // User is authenticated with Firebase, but no profile exists in Firestore.
          // This is a new user, so we create their profile.
          const usersCollectionRef = collection(firestore, 'users');
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
          // CRITICAL: Immediately set the user in the context with the new profile.
          // This prevents the redirect loop.
          setUser(newUserProfile);
        }

      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseContext]);

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !firebaseContext || !firebaseContext.auth) {
      throw new Error("Firebase is not configured. Please add your project credentials to the .env file.");
    }
    try {
        await signInWithEmailAndPassword(firebaseContext.auth, email, password);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !firebaseContext || !firebaseContext.auth) {
      throw new Error("Firebase is not configured.");
    }
    try {
        await createUserWithEmailAndPassword(firebaseContext.auth, email, password);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already in use. Please sign in or use a different email.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters.');
        }
        throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !firebaseContext || !firebaseContext.auth) {
      throw new Error("Firebase is not configured.");
    }
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(firebaseContext.auth, provider);
    } catch (error: any) {
        console.error("Google Sign-In Error: ", error);
        throw new Error("Could not sign in with Google. Please try again.");
    }
  };

  const logout = async () => {
    if (!firebaseContext || !firebaseContext.auth) throw new Error("Firebase Auth not initialized.");
    await signOut(firebaseContext.auth);
  };

  const value = {
    user,
    isLoading,
    isFirebaseConfigured,
    login,
    signUp,
    signInWithGoogle,
    logout,
    role: user?.role || 'guest',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
