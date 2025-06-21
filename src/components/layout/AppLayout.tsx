
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Home, FileText, HelpCircle, LogOut, Tractor, Bell, Users, Cog, UserCheck, Loader2, Truck, LayoutDashboard, Calendar, ClipboardCheck, MailPlus, Send, ShieldAlert, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadNotifications } from '@/lib/localStorageService';
import type { NotificationMessage } from '@/lib/types';


// Define which routes belong to which role
const managerBaseRoutes = ['/', '/reports', '/admin', '/help', '/notifications'];
const employeeBaseRoutes = ['/employee', '/employee/fleet-check', '/pre-trip', '/post-trip', '/reports', '/help', '/employee/time-off', '/notifications'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;

    const isAllowed = (baseRoutes: string[]) => {
      if (pathname.startsWith('/reports/') || pathname.startsWith('/admin/')) return true;
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
  
  useEffect(() => {
      if (user) {
          const notifications = loadNotifications();
          const userNotifications = notifications.filter(
              notif => notif.recipientId === 'all' || notif.recipientId === user.id
          );
          const count = userNotifications.filter(notif => !notif.readBy.includes(user.id)).length;
          setUnreadCount(count);
      }
  }, [user, pathname]); // Re-check on page navigation

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/login' || !role) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-col items-center">
           <Link href={role === 'manager' ? '/' : '/employee'} className="flex items-center gap-2 mb-4 text-center">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold leading-tight">Fleet Check</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {role === 'employee' && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Tools</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/employee">
                    <SidebarMenuButton isActive={pathname === '/employee'}>
                      <LayoutDashboard /><span>Employee Hub</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/employee/fleet-check">
                    <SidebarMenuButton isActive={pathname.startsWith('/employee/fleet-check') || pathname.startsWith('/pre-trip') || pathname.startsWith('/post-trip')}>
                      <Truck /><span>Fleet Check</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/employee/time-off">
                    <SidebarMenuButton isActive={pathname.startsWith('/employee/time-off')}>
                      <CalendarPlus /><span>Time Off</span>
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
                 <SidebarMenuItem>
                  <Link href="/notifications">
                    <SidebarMenuButton isActive={pathname.startsWith('/notifications')}>
                      <Bell />
                      <span>Notifications</span>
                      {unreadCount > 0 && <Badge className="ml-auto">{unreadCount}</Badge>}
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
                    <SidebarMenuItem>
                        <Link href="/admin/manage-requests">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/manage-requests')}>
                                <ClipboardCheck /><span>Requests</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/manage-calendar">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/manage-calendar')}>
                                <Calendar /><span>Calendar</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/send-notification">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/send-notification')}>
                                <Send /><span>Send Notification</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/manage-violations">
                            <SidebarMenuButton isActive={pathname.startsWith('/admin/manage-violations')}>
                                <ShieldAlert /><span>Violations</span>
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
            <Link href="/notifications" passHref>
             <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-5 w-5 text-accent" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs" variant="destructive">{unreadCount}</Badge>
                )}
             </Button>
            </Link>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
