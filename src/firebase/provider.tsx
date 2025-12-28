
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as AppUser } from '@/lib/types';
import { getFirestoreInstance } from '@/lib/firestoreService';


interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication and profile
interface UserState {
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  
  // User state
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserState>({
    firebaseUser: null,
    appUser: null,
    isUserLoading: true,
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserState({ firebaseUser: null, appUser: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    // This is the outer listener for Firebase Auth user (FirebaseUser)
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // User is signed in, now listen for their profile document in real-time
        const db = getFirestoreInstance();
        const userDocRef = doc(db, 'users', fbUser.uid);

        // Immediately set a temporary user state. This allows the app to proceed
        // with routing while the profile data is being fetched.
        setUserState(prevState => ({
          ...prevState,
          firebaseUser: fbUser,
          isUserLoading: true, // Keep loading until profile is fetched
          appUser: prevState.appUser || { // Use existing profile if available, otherwise create temp
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Loading...',
            role: 'employee', // Default role, will be updated
          }
        }));

        const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists()) {
            // Profile exists, update the full state
            setUserState({
              firebaseUser: fbUser,
              appUser: { id: userDocSnap.id, ...userDocSnap.data() } as AppUser,
              isUserLoading: false,
              userError: null,
            });
          } else {
            // This can happen during sign-up. The user is authenticated but the profile doc isn't created yet.
            // We create a temporary profile. The RouteGuard and other components should handle this state gracefully.
            setUserState({
              firebaseUser: fbUser,
              appUser: {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'New User',
                role: 'employee', // Sensible default
              },
              isUserLoading: false,
              userError: null,
            });
          }
        }, (error) => {
          // Error fetching the user's profile document
          console.error("FirebaseProvider: Firestore profile listener error:", error);
          setUserState({ firebaseUser: fbUser, appUser: null, isUserLoading: false, userError: error });
        });

        // Return the cleanup function for the inner (profile) listener
        return () => unsubscribeProfile();

      } else {
        // User is signed out
        setUserState({ firebaseUser: null, appUser: null, isUserLoading: false, userError: null });
      }
    }, (error) => {
      // Error with the main auth listener itself
      console.error("FirebaseProvider: onAuthStateChanged error:", error);
      setUserState({ firebaseUser: null, appUser: null, isUserLoading: false, userError: error });
    });

    // Return the cleanup function for the outer (auth) listener
    return () => unsubscribeAuth();
  }, [auth]); // Re-run effect if the auth service instance changes

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userState.appUser,
      firebaseUser: userState.firebaseUser,
      isUserLoading: userState.isUserLoading,
      userError: userState.userError,
    };
  }, [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    firebaseUser: context.firebaseUser,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error("useAuth must be used within a FirebaseProvider");
  }
  if (!context.auth) {
    throw new Error("Auth service is not available. Check FirebaseProvider setup.");
  }
  return context.auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirestore must be used within a FirebaseProvider");
  }
  if (!context.firestore) {
    throw new Error("Firestore service is not available. Check FirebaseProvider setup.");
  }
  return context.firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebaseApp must be used within a FirebaseProvider");
  }
  if (!context.firebaseApp) {
    throw new Error("FirebaseApp is not available. Check FirebaseProvider setup.");
  }
  return context.firebaseApp;
};

/**
 * A hook to memoize Firebase queries or references, preventing re-renders.
 * It also tags the object with a `__memo` flag for runtime checks.
 * @param factory A function that returns the Firebase query or reference.
 * @param deps A dependency array, just like `useMemo`.
 * @returns The memoized Firebase object.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  
  if (memoized && typeof memoized === 'object') {
    // Add the __memo flag to the object without changing its type signature for the consumer.
    Object.defineProperty(memoized, '__memo', {
      value: true,
      writable: false,
      enumerable: false,
    });
  }
  
  return memoized;
}


/**
 * Hook specifically for accessing the application's user state (with roles).
 * @returns {UserHookResult} Object with user, firebaseUser, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, firebaseUser, isUserLoading, userError } = useFirebase();
  return { user, firebaseUser, isUserLoading, userError };
};
