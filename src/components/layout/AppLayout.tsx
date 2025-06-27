
'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { FileText, HelpCircle, LogOut, Bell, Users, Cog, Loader2, Truck, LayoutDashboard, Calendar, ClipboardCheck, Send, ShieldAlert, CalendarPlus, BookCopy, LineChart, SlidersHorizontal, Wrench, ClipboardList, Receipt, Coins, Briefcase, Building2, ClipboardEdit, Files, FileBadge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadNotifications } from '@/lib/localStorageService';
import type { NotificationMessage, UserRole } from '@/lib/types';
import AiAssistantWidget from '@/components/common/AiAssistantWidget';

const FullScreenLoader = () => (
    <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
);

// This is the single source of truth for page authorization.
const isPathAllowed = (pathname: string, role: UserRole | null): boolean => {
    // --- Define Routes ---
    const managerRoutes = [
        '/admin', '/reports', '/help', '/notifications',
        '/admin/manage-requests', '/admin/manage-tasks', '/admin/manage-violations',
        '/admin/send-notification', '/admin/manage-fleet', '/admin/manage-documents',
        '/admin/manage-calendar', '/admin/maintenance-logs', '/admin/manage-work-orders',
        '/employee'
    ];
    const ownerRoutes = [
        ...managerRoutes,
        '/admin/manage-users', '/admin/manage-expenses', '/admin/manage-clients',
        '/admin/manage-jobs', '/admin/advanced-reports', '/admin/system-settings'
    ];
    const employeeBaseRoutes = ['/employee', '/employee/fleet-check', '/pre-trip', '/post-trip', '/reports', '/help', '/employee/time-off', '/notifications', '/employee/company-documents', '/employee/personal-documents', '/employee/my-tasks', '/employee/submit-expense', '/employee/my-violations'];

    // Rule 1: Guest (not logged in) can ONLY be on the login page.
    if (!role) {
        return pathname === '/login';
    }

    // --- From here, we know the user is authenticated. ---

    // Rule 2: Authenticated users can NEVER be on the login page.
    if (pathname === '/login') {
        return false;
    }
    
    // Rule 3: Allow the root page temporarily; it will be redirected by the layout.
    if (pathname === '/') {
        return true;
    }

    // Rule 4: Check dynamic routes first.
    if (pathname.startsWith('/reports/')) return true; // Anyone logged in can see a report detail
    if (pathname.startsWith('/admin/jobs/')) return role === 'owner'; // Only owners can see job details

    // Rule 5: Check static routes based on role.
    if (role === 'owner') return ownerRoutes.includes(pathname);
    if (role === 'manager') return managerRoutes.includes(pathname);
    if (role === 'employee') return employeeBaseRoutes.includes(pathname);

    // Rule 6: If no rule matches, the path is not allowed.
    return false;
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const showAiAssistantWelcome = searchParams.get('tour') === 'true';

    // This state tracks if we have resolved the initial route and authentication.
    const [isRouteChecked, setIsRouteChecked] = useState(false);

    useEffect(() => {
        // Don't do anything until the auth state is fully loaded from localStorage.
        if (isLoading) {
            return;
        }

        const isAllowed = isPathAllowed(pathname, user?.role || null);

        if (isAllowed) {
            // If user is on an allowed page, we can show the content.
            // Special case: if an authenticated user lands on `/`, redirect them home.
            if (user && pathname === '/') {
                const destination = user.role === 'employee' ? '/employee' : '/admin';
                router.replace(destination);
                // Don't mark route as checked yet, wait for redirect to finish.
                return;
            }
            setIsRouteChecked(true);
        } else {
            // If the user is on a forbidden page, redirect them.
            const destination = user ? (user.role === 'employee' ? '/employee' : '/admin') : '/login';
            router.replace(destination);
            // Don't mark route as checked yet, wait for redirect.
        }

    }, [isLoading, user, pathname, router]);


    // Effect to update notification count.
    useEffect(() => {
        if (user) {
            const notifications = loadNotifications();
            const userNotifications = notifications.filter(
                notif => notif.recipientId === 'all' || notif.recipientId === user.id
            );
            const count = userNotifications.filter(notif => !notif.readBy.includes(user.id)).length;
            setUnreadCount(count);
        }
    }, [user, pathname]);

    // Show the loader until the initial route check and potential redirect are complete.
    if (!isRouteChecked) {
        return <FullScreenLoader />;
    }
    
    // If not logged in, we are on the login page (guaranteed by the effect).
    if (!user) {
        return (
            <>
                {children}
                <AiAssistantWidget initialOpen={false} />
            </>
        );
    }
    
    // If we reach here, user is authenticated and on an allowed page.
    const isAdmin = user.role === 'owner' || user.role === 'manager';
    
    return (
    <SidebarProvider defaultOpen>
      <Sidebar id="tour-step-sidebar">
        <SidebarHeader className="p-4 flex flex-col items-center">
           <Link href={isAdmin ? '/admin' : '/employee'} className="flex items-center gap-2 mb-4 text-center">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold leading-tight">Logan's Excavating</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {user.role === 'employee' && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Tools</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/employee">
                    <SidebarMenuButton tooltip="Employee Hub" isActive={pathname === '/employee'}>
                      <LayoutDashboard /><span>Employee Hub</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/employee/fleet-check">
                    <SidebarMenuButton tooltip="Fleet Check" isActive={pathname.startsWith('/employee/fleet-check') || pathname.startsWith('/pre-trip') || pathname.startsWith('/post-trip')}>
                      <Truck /><span>Fleet Check</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/employee/time-off">
                    <SidebarMenuButton tooltip="Request Time Off" isActive={pathname.startsWith('/employee/time-off')}>
                      <CalendarPlus /><span>Time Off</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/employee/my-tasks">
                    <SidebarMenuButton tooltip="My Tasks" isActive={pathname.startsWith('/employee/my-tasks')}>
                      <ClipboardList /><span>My Tasks</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/employee/submit-expense">
                    <SidebarMenuButton tooltip="Submit Expense" isActive={pathname.startsWith('/employee/submit-expense')}>
                      <Receipt /><span>Submit Expense</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/employee/company-documents">
                    <SidebarMenuButton tooltip="Company Documents" isActive={pathname.startsWith('/employee/company-documents')}>
                      <Files /><span>Company Docs</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/employee/personal-documents">
                    <SidebarMenuButton tooltip="Personal Documents" isActive={pathname.startsWith('/employee/personal-documents')}>
                      <FileBadge /><span>Personal Docs</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/reports">
                    <SidebarMenuButton tooltip="My Reports" isActive={pathname.startsWith('/reports')}>
                      <FileText /><span>My Reports</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/employee/my-violations">
                    <SidebarMenuButton tooltip="My Violations" isActive={pathname.startsWith('/employee/my-violations')}>
                      <ShieldAlert /><span>My Violations</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/notifications">
                    <SidebarMenuButton tooltip="Notifications" isActive={pathname.startsWith('/notifications')}>
                      <Bell />
                      <span>Notifications</span>
                      {unreadCount > 0 && <Badge className="ml-auto">{unreadCount}</Badge>}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Admin Menu</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <Link href="/admin">
                          <SidebarMenuButton tooltip="Dashboard" isActive={pathname === '/admin'}>
                              <LayoutDashboard /><span>Dashboard</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
                
                <SidebarSeparator className="my-1" />
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">People & Comm.</SidebarGroupLabel>
                <SidebarMenu>
                  {user.role === 'owner' && <SidebarMenuItem>
                      <Link href="/admin/manage-users">
                          <SidebarMenuButton tooltip="Manage Employees" isActive={pathname.startsWith('/admin/manage-users')}>
                              <Users /><span>Manage Employees</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>}
                    <SidebarMenuItem>
                      <Link href="/admin/manage-requests">
                          <SidebarMenuButton tooltip="Manage Requests" isActive={pathname.startsWith('/admin/manage-requests')}>
                              <ClipboardCheck /><span>Time Off Requests</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                    {user.role === 'owner' && <SidebarMenuItem>
                      <Link href="/admin/manage-expenses">
                          <SidebarMenuButton tooltip="Manage Expenses" isActive={pathname.startsWith('/admin/manage-expenses')}>
                              <Coins /><span>Manage Expenses</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>}
                    <SidebarMenuItem>
                      <Link href="/admin/manage-tasks">
                          <SidebarMenuButton tooltip="Manage Tasks" isActive={pathname.startsWith('/admin/manage-tasks')}>
                              <ClipboardList /><span>Manage Tasks</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <Link href="/admin/manage-violations">
                          <SidebarMenuButton tooltip="Manage Violations" isActive={pathname.startsWith('/admin/manage-violations')}>
                              <ShieldAlert /><span>Manage Violations</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/send-notification">
                          <SidebarMenuButton tooltip="Send Notification" isActive={pathname.startsWith('/admin/send-notification')}>
                              <Send /><span>Send Notification</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator className="my-1" />
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Assets & Content</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <Link href="/admin/manage-fleet">
                          <SidebarMenuButton tooltip="Manage Fleet" isActive={pathname.startsWith('/admin/manage-fleet')}>
                              <Truck /><span>Manage Fleet</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/manage-documents">
                          <SidebarMenuButton tooltip="Manage Documents" isActive={pathname.startsWith('/admin/manage-documents')}>
                              <BookCopy /><span>Manage Documents</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/manage-calendar">
                          <SidebarMenuButton tooltip="Manage Calendar" isActive={pathname.startsWith('/admin/manage-calendar')}>
                              <Calendar /><span>Manage Calendar</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator className="my-1" />
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Ops & Analytics</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <Link href="/reports">
                          <SidebarMenuButton tooltip="Inspection Reports" isActive={pathname.startsWith('/reports')}>
                              <FileText /><span>Inspection Reports</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/maintenance-logs">
                          <SidebarMenuButton tooltip="Maintenance Logs" isActive={pathname.startsWith('/admin/maintenance-logs')}>
                              <Wrench /><span>Maintenance Logs</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <Link href="/admin/manage-work-orders">
                          <SidebarMenuButton tooltip="Manage Work Orders" isActive={pathname.startsWith('/admin/manage-work-orders')}>
                              <ClipboardEdit /><span>Manage Work Orders</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
                  {user.role === 'owner' && <SidebarMenuItem>
                      <Link href="/admin/manage-clients">
                          <SidebarMenuButton tooltip="Manage Clients" isActive={pathname.startsWith('/admin/manage-clients')}>
                              <Building2 /><span>Manage Clients</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>}
                  {user.role === 'owner' && <SidebarMenuItem>
                      <Link href="/admin/manage-jobs">
                          <SidebarMenuButton tooltip="Manage Jobs" isActive={pathname.startsWith('/admin/manage-jobs')}>
                              <Briefcase /><span>Manage Jobs</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>}
                  {user.role === 'owner' && <SidebarMenuItem>
                      <Link href="/admin/advanced-reports">
                          <SidebarMenuButton tooltip="Advanced Reports" isActive={pathname.startsWith('/admin/advanced-reports')}>
                              <LineChart /><span>Advanced Reports</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>}
                </SidebarMenu>
                
                {user.role === 'owner' && <>
                  <SidebarSeparator className="my-1" />
                  <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">System</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin/system-settings">
                            <SidebarMenuButton tooltip="System Settings" isActive={pathname.startsWith('/admin/system-settings')}>
                                <SlidersHorizontal /><span>System Settings</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </>}
              </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="p-2">
            <SidebarMenu>
                 <SidebarMenuItem id={isAdmin ? "tour-step-sidebar-help" : "tour-step-sidebar-help-employee"}>
                    <Link href="/help">
                        <SidebarMenuButton tooltip="Help & Support" isActive={pathname === '/help'}>
                            <HelpCircle /><span>Help</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                     <SidebarMenuButton tooltip="Logout" onClick={() => {
                        const { logout } = useAuth.getState();
                        logout();
                     }}>
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
                <Bell className="h-5 w-5 text-accent-foreground" />
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
      <AiAssistantWidget initialOpen={showAiAssistantWelcome} />
    </SidebarProvider>
  );
}
