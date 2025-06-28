
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
    // We no longer save the user to localStorage to disable automatic login.
    set({ user: loggedInUser, isLoading: false });
  },
  logout: () => {
    // Still good practice to clear any old data that might exist.
    try {
      localStorage.removeItem('fleetCheckUser');
    } catch (error) {
       console.error("Could not access localStorage to logout", error);
    }
    set({ user: null, isLoading: false });
  },
}));

// A client-side initializer component. It now simply sets the app to a
// "loaded" state without logging anyone in automatically.
function AuthInitializer() {
    useEffect(() => {
        // This ensures the default users are correctly seeded on app load.
        loadUsers(); 
        
        // Set loading to false after the component mounts.
        // This ensures we always start fresh without a logged-in user.
        authStore.setState({ isLoading: false, user: null });
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
