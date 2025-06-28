
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createStore, useStore } from 'zustand';
import type { UserRole, User } from '@/lib/types';
import { loadUsers, saveUsers } from '@/lib/localStorageService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const authStore = createStore<AuthState>((set) => ({
  user: null,
  isLoading: true, // Start as loading
  login: (loggedInUser: User) => {
    try {
      sessionStorage.setItem('fleetCheckUser', JSON.stringify(loggedInUser));
    } catch (error) {
       console.error("Could not access sessionStorage to save user", error);
    }
    set({ user: loggedInUser, isLoading: false });
  },
  logout: () => {
    try {
      sessionStorage.removeItem('fleetCheckUser');
    } catch (error) {
       console.error("Could not access sessionStorage to logout", error);
    }
    set({ user: null, isLoading: false });
  },
}));

// A client-side initializer component
function AuthInitializer() {
    useEffect(() => {
        // This ensures the default users are correctly seeded on app load.
        loadUsers(); 
        
        try {
            const storedUser = sessionStorage.getItem('fleetCheckUser');
            if (storedUser) {
                authStore.setState({ user: JSON.parse(storedUser), isLoading: false });
            } else {
                authStore.setState({ isLoading: false, user: null });
            }
        } catch (error) {
            console.error("Could not access sessionStorage", error);
            authStore.setState({ isLoading: false, user: null });
        }
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
  const state = useStore(authStore);
  
  // Expose role for convenience
  return { ...state, role: state.user?.role };
}
