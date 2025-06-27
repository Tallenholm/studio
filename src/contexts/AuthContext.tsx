
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createStore, useStore } from 'zustand';
import type { UserRole, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  _setLoading: (isLoading: boolean) => void;
  _setUser: (user: User | null) => void;
}

// Using Zustand for state management to avoid context provider re-rendering issues.
const authStore = createStore<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: (loggedInUser: User) => {
    try {
      localStorage.setItem('fleetCheckUser', JSON.stringify(loggedInUser));
      set({ user: loggedInUser });
    } catch (error) {
       console.error("Could not access localStorage to login", error);
    }
  },
  logout: () => {
    try {
      localStorage.removeItem('fleetCheckUser');
      set({ user: null });
    } catch (error) {
       console.error("Could not access localStorage to logout", error);
    }
  },
  _setLoading: (isLoading) => set({ isLoading }),
  _setUser: (user) => set({ user }),
}));

// A client-side initializer component that runs once.
function AuthInitializer() {
    useEffect(() => {
        let isMounted = true;
        try {
            const storedUser = localStorage.getItem('fleetCheckUser');
            if (isMounted) {
                if (storedUser) {
                    const parsedUser: User = JSON.parse(storedUser);
                    authStore.getState()._setUser(parsedUser);
                }
            }
        } catch (error) {
            console.error("Could not access localStorage to initialize auth", error);
        } finally {
            if (isMounted) {
                authStore.getState()._setLoading(false);
            }
        }
        return () => {
            isMounted = false;
        };
    }, []);

    return null; // This component renders nothing.
}

// The provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
    </>
  );
}

// The hook to access auth state and actions
export function useAuth() {
  return useStore(authStore);
}
