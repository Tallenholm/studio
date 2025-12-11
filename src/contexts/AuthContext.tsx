
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, getAuth, Auth, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase-initialize';
import type { User, UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FullScreenLoader = ({ text = 'Loading...' }: { text?: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { auth, db } = initializeFirebase();

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        if (db) {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          } else {
            // Handle case where user exists in Auth but not Firestore
            setUser({ 
                id: fbUser.uid, 
                uid: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'New User',
                role: 'employee' 
            });
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  const value = { user, firebaseUser, isLoading, auth };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <FullScreenLoader /> : children}
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
