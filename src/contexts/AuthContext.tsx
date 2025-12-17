
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, Auth, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { getFirestoreInstance } from '@/lib/firestoreService';
import { useAuth as useFirebaseAuth } from '@/firebase/provider';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const auth = useFirebaseAuth();

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const db = getFirestoreInstance();
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        // Use onSnapshot for real-time user role updates
        const unsubUserDoc = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            setUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          } else {
            // This might happen during sign-up before the user doc is created.
            setUser({
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || 'New User',
              role: 'employee', // Default role
            });
          }
          setIsLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(null);
            setIsLoading(false);
        });

        return () => unsubUserDoc();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const value = { user, firebaseUser, isLoading, auth };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    