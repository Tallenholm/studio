
'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, HelpCircle, LogOut, Bell, Users, Cog, Loader2, Truck, LayoutDashboard, Calendar, ClipboardCheck, Send, ShieldAlert, CalendarPlus, BookOpen, LineChart, SlidersHorizontal, Wrench, ClipboardList, Receipt, Coins, Briefcase, Building2, ClipboardEdit, Files, FileBadge, HeartPulse, Snowflake, Droplets, Package, Calculator, Hammer, Route, ArrowRightLeft, Cloud, User as UserIcon } from 'lucide-react';
import { useUser, useAuth as useFirebaseAuth } from '@/firebase/provider';
import type { NotificationMessage, UserRole } from '@/lib/types';
import AiAssistantWidget from '@/components/common/AiAssistantWidget';
import CommandPalette from '@/components/common/CommandPalette';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalTools } from '@/hooks/use-global-tools';
import GlobalToolsWidget from '@/components/common/GlobalToolsWidget';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firestoreService';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// --- Authorization Configuration ---
const PATH_CONFIG = {
  PUBLIC: ['/login'],
  SHARED_AUTH: ['/help', '/notifications', '/weather', '/my-profile'], // Note: dynamic routes need to check with startsWith
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
    
    // Check shared authenticated routes
    if (PATH_CONFIG.SHARED_AUTH.some(p => pathname.startsWith(p) && (pathname.length === p.length || pathname[p.length] === '/'))) {
        return true;
    }
    
    // Check employee-only base routes
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

const FullScreenLoader = ({ text = 'Loading...' }: { text?: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const auth = useFirebaseAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const searchParams = useSearchParams();
    const showAiAssistantWelcome = searchParams.get('tour') === 'true';
    const { open: openCommandPalette } = useCommandPalette();
    const { open: openTools } = useGlobalTools();
    const [isSidebarDefaultOpen, setIsSidebarDefaultOpen] = useState(true);

    const logout = () => {
      auth.signOut();
    }
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedState = document.cookie.split('; ').find(row => row.startsWith('sidebar_state='));
            if (savedState) {
                setIsSidebarDefaultOpen(savedState.split('=')[1] === 'true');
            }
        }
    }, []);

    // This single useEffect handles all redirection logic for a logged-in user.
    useEffect(() => {
        if (isUserLoading || !user) {
            return; // Don't do anything until we're sure who the user is
        }
        
        const role = user.role || 'guest';
        const isAllowed = isPathAllowed(pathname, role);
        const isOnPublicPath = PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
        const isOnRootPath = pathname === '/';

        let destination: string | null = null;
        
        // Priority 1: If a logged-in user is on a public page or the root, redirect them.
        if (isOnPublicPath || isOnRootPath) {
            destination = role === 'employee' ? '/employee' : '/admin';
        }
        // Priority 2: If they are on a path not allowed for their role, redirect them.
        else if (!isAllowed) {
            destination = role === 'employee' ? '/employee' : '/admin';
        }
        
        if (destination && destination !== pathname) {
            router.replace(destination);
        }
        
    }, [pathname, user, isUserLoading, router]);

    useEffect(() => {
        if (!user?.id) return;
        const db = getFirestoreInstance();
        
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef, 
            where('recipientId', 'in', ['all', user.id])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let count = 0;
            const liveNotifications: NotificationMessage[] = [];
            snapshot.forEach(doc => {
                const notif = { id: doc.id, ...doc.data() } as NotificationMessage;
                liveNotifications.push(notif);
                if (!notif.readBy.includes(user.id)) {
                    count++;
                }
            });
            liveNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            setUnreadCount(count);
        }, (error) => {
            console.error("Error fetching real-time notifications:", error);
        });

        return () => unsubscribe();
    }, [user?.id]);
    
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          openCommandPalette()
        }
        if (e.key === "t" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          openTools()
        }
      }
      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [openCommandPalette, openTools])
    
    const isCurrentlyAllowed = user ? isPathAllowed(pathname, user.role) : false;
    const isOnPublicPath = PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));
    // If we're about to redirect, show a loader to prevent flicker
    if ((isOnPublicPath && user) || (pathname === '/' && user) || (!isCurrentlyAllowed && user)) {
        return <FullScreenLoader text="Redirecting..." />;
    }

    if (!isCurrentlyAllowed && !isUserLoading) {
        return <FullScreenLoader text="Access Denied. Redirecting..." />;
    }

    const isAdmin = user.role === 'owner' || user.role === 'manager';
    
    return (
        <SidebarProvider defaultOpen={isSidebarDefaultOpen}>
            <Sidebar id="tour-step-sidebar" variant="inset" className="print-hidden">
                <SidebarHeader className="p-4 flex flex-col items-center">
                    <Link href={isAdmin ? '/admin' : '/employee'} className="flex items-center gap-2 mb-4 text-center">
                        <span className="font-headline text-2xl font-bold text-primary">Logan's Excavating</span>
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
                                    <Link href="/my-profile">
                                        <SidebarMenuButton tooltip="My Profile" isActive={pathname.startsWith('/my-profile')}>
                                            <UserIcon /><span>My Profile</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/employee/fleet-check">
                                        <SidebarMenuButton tooltip="Vehicle Inspections" isActive={pathname.startsWith('/employee/fleet-check') || pathname.startsWith('/pre-trip') || pathname.startsWith('/post-trip')}>
                                            <Truck /><span>Vehicle Inspections</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/employee/snow-routes">
                                        <SidebarMenuButton tooltip="Snow Routes" isActive={pathname.startsWith('/employee/snow-routes')}>
                                            <Route /><span>Snow Routes</span>
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
                                        <SidebarMenuButton tooltip="Policies & Documents" isActive={pathname.startsWith('/employee/company-documents')}>
                                            <BookOpen /><span>Policies & Documents</span>
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
                                <SidebarMenuItem>
                                    <Link href="/my-profile">
                                        <SidebarMenuButton tooltip="My Profile" isActive={pathname.startsWith('/my-profile')}>
                                            <UserIcon /><span>My Profile</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/weather">
                                        <SidebarMenuButton tooltip="Weather Center" isActive={pathname.startsWith('/weather')}>
                                            <Cloud /><span>Weather Center</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            </SidebarMenu>
                            
                            <SidebarSeparator className="my-1" />
                            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">People & Comms</SidebarGroupLabel>
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
                                    <Link href="/admin/personal-documents">
                                        <SidebarMenuButton tooltip="Personal Documents" isActive={pathname.startsWith('/admin/personal-documents')}>
                                            <FileBadge /><span>Personal Documents</span>
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
                                    <Link href="/admin/fleet-health">
                                        <SidebarMenuButton tooltip="Fleet Health" isActive={pathname.startsWith('/admin/fleet-health')}>
                                            <HeartPulse /><span>Fleet Health</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                 <SidebarMenuItem>
                                    <Link href="/admin/manage-inventory">
                                        <SidebarMenuButton tooltip="Manage Inventory" isActive={pathname.startsWith('/admin/manage-inventory')}>
                                            <Hammer /><span>Inventory</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-documents">
                                        <SidebarMenuButton tooltip="Policies & Documents" isActive={pathname.startsWith('/admin/manage-documents')}>
                                            <BookOpen /><span>Policies & Documents</span>
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
                                {user.role === 'owner' && <>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-clients">
                                        <SidebarMenuButton tooltip="Manage Clients" isActive={pathname.startsWith('/admin/manage-clients')}>
                                            <Building2 /><span>Manage Clients</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-jobs">
                                        <SidebarMenuButton tooltip="Excavation Jobs" isActive={pathname.startsWith('/admin/manage-jobs')}>
                                            <Briefcase /><span>Excavation Jobs</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-snow">
                                        <SidebarMenuButton tooltip="Snow Contracts" isActive={pathname.startsWith('/admin/manage-snow')}>
                                            <Snowflake /><span>Snow Contracts</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-snow-routes">
                                        <SidebarMenuButton tooltip="Snow Routes" isActive={pathname.startsWith('/admin/manage-snow-routes')}>
                                            <Route /><span>Snow Routes</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-rentals">
                                        <SidebarMenuButton tooltip="Manage Rentals" isActive={pathname.startsWith('/admin/manage-rentals')}>
                                            <ArrowRightLeft /><span>Manage Rentals</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-concrete">
                                        <SidebarMenuButton tooltip="Concrete Jobs" isActive={pathname.startsWith('/admin/manage-concrete')}>
                                            <Droplets /><span>Concrete Jobs</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <Link href="/admin/manage-misc">
                                        <SidebarMenuButton tooltip="Misc Jobs" isActive={pathname.startsWith('/admin/manage-misc')}>
                                            <Package /><span>Misc. Jobs</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                </>}
                                <SidebarMenuItem>
                                    <Link href="/reports">
                                        <SidebarMenuButton tooltip="Inspection Reports" isActive={pathname === '/reports' || pathname.startsWith('/reports/')}>
                                            <FileText /><span>Inspection Reports</span>
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
                                <SidebarMenuItem>
                                    <Link href="/admin/maintenance-logs">
                                        <SidebarMenuButton tooltip="Maintenance Logs" isActive={pathname.startsWith('/admin/maintenance-logs')}>
                                            <Wrench /><span>Maintenance Logs</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                                {user.role === 'owner' && <SidebarMenuItem>
                                    <Link href="/admin/advanced-reports">
                                        <SidebarMenuButton tooltip="Advanced Reports" isActive={pathname.startsWith('/admin/advanced-reports')}>
                                            <LineChart /><span>Advanced Reports</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>}
                                 <SidebarMenuItem>
                                    <Link href="/admin/fleet-tools">
                                        <SidebarMenuButton tooltip="Operations Toolkit" isActive={pathname.startsWith('/admin/fleet-tools')}>
                                            <Calculator /><span>Operations Toolkit</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
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
                        <SidebarMenuItem>
                           <Button variant="ghost" className="w-full justify-start" onClick={openCommandPalette}>
                             <span className="mr-auto">Search...</span>
                             <kbd className="ml-4 hidden rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-block">⌘K</kbd>
                           </Button>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Operations Toolkit" onClick={openTools}>
                                <Calculator />
                                <span>Operations Toolkit</span>
                                <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-block">⌘T</kbd>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem id={isAdmin ? "tour-step-sidebar-help" : "tour-step-sidebar-help-employee"}>
                            <Link href="/help">
                                <SidebarMenuButton tooltip="Help & Support" isActive={pathname === '/help'}>
                                    <HelpCircle /><span>Help & Support</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Logout" onClick={logout}>
                                <LogOut /><span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6 md:justify-end print-hidden">
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
                <main className="flex-1 p-6 overflow-auto app-layout-main">
                    <FirebaseErrorListener />
                    {children}
                </main>
            </SidebarInset>
            <CommandPalette />
            <AiAssistantWidget initialOpen={showAiAssistantWelcome} />
            <GlobalToolsWidget />
        </SidebarProvider>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until Firebase has determined the auth state.
        }

        const isGuest = !user;
        const isOnPublicPath = PATH_CONFIG.PUBLIC.some(p => pathname.startsWith(p));

        if (isGuest && !isOnPublicPath) {
            router.replace('/login');
        }
    }, [user, isUserLoading, pathname, router]);

    // While loading the auth state, show a full-screen loader.
    if (isUserLoading) {
        return <FullScreenLoader />;
    }

    // If the user is not authenticated, render the children (which will be the Login page).
    if (!user) {
        return <>{children}</>;
    }

    // If the user is authenticated, render the main layout.
    // The AuthenticatedLayout itself will handle role-based redirects.
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
