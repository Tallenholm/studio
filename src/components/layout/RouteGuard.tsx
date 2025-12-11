
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from './AppLayout';
import type { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
    if (role === 'owner') return true;
    if (role === 'guest') return PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
    
    if (PATH_CONFIG.SHARED_AUTH.some(p => pathname.startsWith(p) && (pathname.length === p.length || pathname[p.length] === '/'))) {
        return true;
    }
    
    if (PATH_CONFIG.EMPLOYEE_ONLY.some(p => pathname.startsWith(p))) {
        return true;
    }

    const isEmployeePath = pathname.startsWith('/employee');
    const isAdminPath = pathname.startsWith(PATH_CONFIG.ADMIN_BASE);

    if (role === 'employee') {
        return isEmployeePath;
    }

    if (role === 'manager') {
        if (PATH_CONFIG.OWNER_ONLY.some(p => pathname.startsWith(p))) {
            return false;
        }
        return isAdminPath || isEmployeePath;
    }

    return false;
}

const FullScreenLoader = ({ text }: { text: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait until auth state is determined

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
  }, [isLoading, user, pathname, router]);

  // Determine what to render based on current state
  const role = user?.role || 'guest';
  const isAllowed = isPathAllowed(pathname, role);
  
  if (isLoading) {
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
  
  // If user is not logged in, just show the children (e.g., Login page)
  if (!user) {
    return <>{children}</>;
  }

  // If user is logged in and path is allowed, show the main layout
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
