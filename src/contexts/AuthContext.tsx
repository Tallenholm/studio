
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'employee' | 'manager' | null;

interface AuthContextType {
  role: Role;
  user: { name: string } | null;
  login: (role: 'employee' | 'manager', user: { name: string }) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      const storedUserName = localStorage.getItem('userName');
      if (storedRole && storedUserName) {
        setRole(storedRole);
        setUser({ name: storedUserName });
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newRole: 'employee' | 'manager', user: { name: string }) => {
    try {
      localStorage.setItem('userRole', newRole);
      localStorage.setItem('userName', user.name);
      setRole(newRole);
      setUser(user);
      if (newRole === 'employee') {
        router.push('/employee');
      } else {
        router.push('/');
      }
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      setRole(null);
      setUser(null);
      router.push('/login');
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  }, [router]);

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
