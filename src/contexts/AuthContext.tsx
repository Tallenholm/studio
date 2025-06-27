
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRole, User } from '@/lib/types';

type AuthRole = UserRole | null;

interface AuthContextType {
  role: AuthRole;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AuthRole>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    try {
      const storedUser = localStorage.getItem('fleetCheckUser');
      if (isMounted) {
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setRole(parsedUser.role);
          setUser(parsedUser);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
      if (isMounted) {
        setIsLoading(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((loggedInUser: User) => {
    try {
      localStorage.setItem('fleetCheckUser', JSON.stringify(loggedInUser));
      setRole(loggedInUser.role);
      setUser(loggedInUser);
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('fleetCheckUser');
      setRole(null);
      setUser(null);
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, user, login, logout, isLoading }}>
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
