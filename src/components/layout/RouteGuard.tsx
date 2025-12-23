
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppLayout from './AppLayout';
import type { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/provider';

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
    '/admin/manage-snow',
    '/admin/manage-snow-routes',
    '/admin/manage-concrete',
    '/admin/manage-misc',
    '/admin/manage-rentals',
    '/admin/advanced-reports',
    '/admin/system-settings',
  ],
};

function isPathAllowed(pathname: string, role: UserRole | 'guest'): boolean {
    // 1. Guests can only access public paths
    if (role === 'guest') {
        return PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
    }
    
    // 2. All authenticated users can access shared paths
    if (PATH_CONFIG.SHARED_AUTH.some(p => pathname.startsWith(p) && (pathname.length === p.length || pathname[p.length] === '/'))) {
        return true;
    }

    // 3. Owners can go anywhere (except public paths if logged in)
    if (role === 'owner') {
        return !PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
    }
    
    // 4. Role-specific paths
    if (role === 'employee') {
        return PATH_CONFIG.EMPLOYEE_ONLY.some(p => pathname.startsWith(p));
    }

    if (role === 'manager') {
        // Managers can access admin paths that are not owner-only
        if (pathname.startsWith(PATH_CONFIG.ADMIN_BASE)) {
            return !PATH_CONFIG.OWNER_ONLY.some(p => pathname.startsWith(p));
        }
        // Managers can also access employee paths
        return PATH_CONFIG.EMPLOYEE_ONLY.some(p => pathname.startsWith(p));
    }
    
    // 5. Default to false if no rules match
    return false;
}


const FullScreenLoader = ({ text }: { text: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until auth state is determined

    const role = user?.role || 'guest';
    const isPublicPath = PATH_CONFIG.PUBLIC.includes(pathname);
    const isAllowed = isPathAllowed(pathname, role);

    // If user is logged in
    if (user) {
      if (isPublicPath || pathname === '/') {
        // Redirect from login or root to appropriate dashboard
        const destination = user.role === 'employee' ? '/employee' : '/admin';
        router.replace(destination);
      } else if (!isAllowed) {
        // Redirect from a forbidden path to appropriate dashboard
        const destination = user.role === 'employee' ? '/employee' : '/admin';
        router.replace(destination);
      }
    } else { // If user is not logged in
      if (!isPublicPath) {
        router.replace('/login');
      }
    }
  }, [isUserLoading, user, pathname, router]);

  // Determine what to render based on current state
  const role = user?.role || 'guest';
  const isAllowed = isPathAllowed(pathname, role);
  
  if (isUserLoading) {
    return <FullScreenLoader text="Authenticating..." />;
  }

  // If a redirect is pending, show a loader to avoid content flicker
  if (user && (PATH_CONFIG.PUBLIC.includes(pathname) || pathname === '/')) {
    return <FullScreenLoader text="Redirecting..." />;
  }
  if (!user && !PATH_CONFIG.PUBLIC.includes(pathname)) {
    return <FullScreenLoader text="Redirecting..." />;
  }
  if (user && !isAllowed) {
    return <FullScreenLoader text="Access Denied. Redirecting..." />;
  }
  
  const isAppPage = !PATH_CONFIG.PUBLIC.includes(pathname);
  
  // If user is not logged in, just show the children (e.g., Login page)
  if (!user && !isAppPage) {
    return <>{children}</>;
  }

  // If it's an app page and user is authenticated, show the layout
  if (user && isAppPage) {
    return (
      <AppLayout>
        {children}
      </AppLayout>
    );
  }

  // Fallback for login page if no user
  if (!user && isPublicPath) {
    return <>{children}</>;
  }

  // Default loader while redirects happen
  return <FullScreenLoader text="Loading..." />;
}
