
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createStore, useStore } from 'zustand';
import type { UserRole, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// We can't use the regular `create` from zustand because we need to share this
// state between the hook and the provider logic.
const authStore = createStore<AuthState>((set) => ({
  user: null,
  isLoading: true, // Start as loading
  login: (loggedInUser: User) => {
    try {
      localStorage.setItem('fleetCheckUser', JSON.stringify(loggedInUser));
      set({ user: loggedInUser, isLoading: false });
    } catch (error) {
       console.error("Could not access localStorage to login", error);
       set({ isLoading: false });
    }
  },
  logout: () => {
    try {
      localStorage.removeItem('fleetCheckUser');
      set({ user: null, isLoading: false });
    } catch (error) {
       console.error("Could not access localStorage to logout", error);
       set({ isLoading: false });
    }
  },
}));

// A client-side initializer component that runs once to check localStorage.
function AuthInitializer() {
    useEffect(() => {
        let isMounted = true;
        try {
            const storedUser = localStorage.getItem('fleetCheckUser');
            if (isMounted) {
                if (storedUser) {
                    const parsedUser: User = JSON.parse(storedUser);
                    authStore.setState({ user: parsedUser, isLoading: false });
                } else {
                    authStore.setState({ user: null, isLoading: false });
                }
            }
        } catch (error) {
            console.error("Could not access localStorage to initialize auth", error);
            if (isMounted) {
                authStore.setState({ isLoading: false });
            }
        }
        return () => {
            isMounted = false;
        };
    }, []);

    return null; // This component renders nothing.
}

// The provider component wraps the app and includes the initializer.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
    </>
  );
}

// The hook to access auth state and actions from any client component.
export function useAuth() {
  return useStore(authStore);
}
