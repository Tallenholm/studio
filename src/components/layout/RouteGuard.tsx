
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/provider';
import dynamic from 'next/dynamic';

const AppLayout = dynamic(() => import('./AppLayout'), {
  loading: () => <FullScreenLoader text="Loading Application..." />,
  ssr: false,
});

const PATH_CONFIG = {
  PUBLIC: ['/login'],
  SHARED_AUTH: ['/help', '/notifications', '/weather', '/my-profile', '/reports'],
  EMPLOYEE_ONLY: [
    '/employee',
    '/pre-trip',
    '/post-trip',
  ],
  ADMIN_BASE: '/admin',
  OWNER_ONLY: [
    '/admin/manage-users',
    '/admin/manage-expenses',
    '/admin/manage-clients',
    '/admin/manage-jobs',
    '/admin/manage-rentals',
    '/admin/advanced-reports',
    '/admin/system-settings',
  ],
};

function isPathAllowed(pathname: string, role: UserRole | 'guest'): boolean {
    if (role === 'guest') {
        return PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
    }

    if (PATH_CONFIG.SHARED_AUTH.some(p => pathname.startsWith(p))) {
        return true;
    }
    
    // Allow access to /reports and specific report details
    if (pathname.startsWith('/reports')) {
        return true;
    }
    
    if (PATH_CONFIG.EMPLOYEE_ONLY.some(p => pathname.startsWith(p))) {
        return role === 'employee' || role === 'manager' || role === 'owner';
    }

    if (pathname.startsWith(PATH_CONFIG.ADMIN_BASE)) {
        if (role === 'owner') return true;
        if (role === 'manager') {
            // Managers can access admin pages that are NOT owner-only
            return !PATH_CONFIG.OWNER_ONLY.some(p => pathname.startsWith(p));
        }
        return false;
    }
    
    return false; // Default deny
}


const FullScreenLoader = ({ text }: { text: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (isUserLoading) {
      return;
    }

    const role = user?.role || 'guest';
    const isPublicPath = PATH_CONFIG.PUBLIC.includes(pathname);
    const isAllowed = isPathAllowed(pathname, role);

    if (firebaseUser) {
      // User is authenticated
      if (isPublicPath || pathname === '/') {
        // If on a public page or root, redirect to their dashboard
        const destination = role === 'employee' ? '/employee' : '/admin';
        router.replace(destination);
      } else if (!isAllowed) {
        // If on a protected page they are not allowed to see, redirect
        const destination = role === 'employee' ? '/employee' : '/admin';
        console.warn(`Redirecting unauthorized user (role: ${role}) from ${pathname} to ${destination}`);
        router.replace(destination);
      }
      // If they are allowed, do nothing, let them see the page.
    } else { 
      // User is not authenticated
      if (!isPublicPath) {
        // If not on a public page, redirect to login
        router.replace('/login');
      }
    }
  }, [firebaseUser, user, isUserLoading, pathname, router]);

  // Determine what to render
  if (isUserLoading) {
    return <FullScreenLoader text="Authenticating..." />;
  }

  const isAppPage = !PATH_CONFIG.PUBLIC.includes(pathname);

  if (firebaseUser && isAppPage) {
    // If user is logged in and on an app page they are allowed to see, show the app
    if (isPathAllowed(pathname, user?.role || 'guest')) {
      return <AppLayout>{children}</AppLayout>;
    }
    // Otherwise, they are being redirected, so show a loader.
    return <FullScreenLoader text="Redirecting..." />;
  }

  if (!firebaseUser && PATH_CONFIG.PUBLIC.includes(pathname)) {
    // If user is not logged in and on a public page, show the page
    return <>{children}</>;
  }
  
  // Default case, usually seen briefly during redirects
  return <FullScreenLoader text="Loading..." />;
}
