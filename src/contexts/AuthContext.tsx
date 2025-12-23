
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Auth, User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { useUser } from '@/firebase/provider'; // Renamed to avoid conflict

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  auth: Auth | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, isUserLoading, auth } = useUser();

  const value = { user, firebaseUser, isLoading: isUserLoading, auth };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// This hook is kept for components that might still use it, but it now
// gets its data from the single source of truth in FirebaseProvider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
