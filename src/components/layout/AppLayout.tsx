
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, FileText, HelpCircle, LogOut, Tractor, AlertTriangle, Users, Cog, UserCheck, Loader2, Truck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Define which routes belong to which role
const managerBaseRoutes = ['/', '/reports', '/admin', '/help'];
const employeeBaseRoutes = ['/employee', '/employee/fleet-check', '/employee/time-clock', '/pre-trip', '/post-trip', '/reports', '/help'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, logout, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to be loaded from localStorage

    // Check if the current path is allowed for the user's role
    const isAllowed = (baseRoutes: string[]) => {
      // Allow access to specific report detail pages
      if (pathname.startsWith('/reports/')) return true;
      // Check against base routes
      return baseRoutes.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));
    };

    if (!role && pathname !== '/login') {
      router.push('/login');
    } else if (role === 'manager' && !isAllowed(managerBaseRoutes)) {
      router.push('/');
    } else if (role === 'employee' && !isAllowed(employeeBaseRoutes)) {
      router.push('/employee');
    }
  }, [pathname, role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render only the login page without the main layout
  if (pathname === '/login' || !role) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-col items-center">
           <Link href={role === 'manager' ? '/' : '/employee'} className="flex items-center gap-2 mb-4 text-center">
            <Tractor className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-bold leading-tight">Logans Excavating<br />& Snow Removal</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {role === 'employee' && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Tools</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/employee">
                    <SidebarMenuButton isActive={pathname.startsWith('/employee')}>
                      <LayoutDashboard /><span>Employee Hub</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/reports">
                    <SidebarMenuButton isActive={pathname.startsWith('/reports')}>
                      <FileText /><span>My Reports</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {role === 'manager' && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Hub</SidebarGroupLabel>
                 <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/">
                        <SidebarMenuButton isActive={pathname === '/'}>
                          <LayoutDashboard /><span>Hub Dashboard</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarSeparator className="my-2" />
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Fleet Check App</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin">
                            <SidebarMenuButton isActive={pathname === '/admin'}>
                                <Truck /><span>Dashboard</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/reports">
                            <SidebarMenuButton isActive={pathname.startsWith('/reports')}>
                                <FileText /><span>Reports</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/manage-users">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/manage-users')}>
                                <Users /><span>Users</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/manage-fleet">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/manage-fleet')}>
                                <Cog /><span>Fleet</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
        <SidebarFooter className="p-2">
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/help">
                        <SidebarMenuButton isActive={pathname === '/help'}>
                            <HelpCircle /><span>Help</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                     <SidebarMenuButton onClick={logout}>
                        <LogOut /><span>Logout</span>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6 md:justify-end">
            <SidebarTrigger className="md:hidden" />
             <Button variant="ghost" size="icon" aria-label="Notifications (Placeholder)">
                <AlertTriangle className="h-5 w-5 text-accent" />
             </Button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
