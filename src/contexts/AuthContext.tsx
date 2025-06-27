
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('fleetCheckUser');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setRole(parsedUser.role);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((loggedInUser: User) => {
    try {
      const tourKey = `hasViewedTour_${loggedInUser.role}`;
      const hasViewedTour = localStorage.getItem(tourKey);
      
      localStorage.setItem('fleetCheckUser', JSON.stringify(loggedInUser));
      setRole(loggedInUser.role);
      setUser(loggedInUser);

      const destination = loggedInUser.role === 'employee' ? '/employee' : '/admin';
      
      if (!hasViewedTour) {
        router.push(`${destination}?tour=true`);
      } else {
        router.push(destination);
      }
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('fleetCheckUser');
      setRole(null);
      setUser(null);
      router.push('/login');
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, [router]);

  // If loading is done and there's no role, redirect to login, unless already there.
  useEffect(() => {
    if (!isLoading && !role && pathname !== '/login') {
      router.push('/login');
    }
  }, [isLoading, role, pathname, router]);


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
