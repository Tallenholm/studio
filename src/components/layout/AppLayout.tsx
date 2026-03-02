
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
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarInset,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, HelpCircle, LogOut, Bell, Users, Cog, Truck, LayoutDashboard, Calendar, ClipboardCheck, Send, ShieldAlert, CalendarPlus, BookOpen, LineChart, SlidersHorizontal, Wrench, ClipboardList, Receipt, Coins, Briefcase, Building2, ClipboardEdit, FileBadge, HeartPulse, Route, Calculator, Cloud, User as UserIcon, Loader2, Map as MapIcon, Hammer } from 'lucide-react';
import type { NotificationMessage } from '@/lib/types';
import CommandPalette from '@/components/common/CommandPalette';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useGlobalTools } from '@/hooks/use-global-tools';
import GlobalToolsWidget from '@/components/common/GlobalToolsWidget';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firestoreService';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useAuth, useUser } from '@/firebase/provider';
import AiAssistantWidget from '@/components/common/AiAssistantWidget';

const getPageTitle = (pathname: string): string => {
    if (pathname === '/admin' || pathname === '/employee') return 'Dashboard';
    if (pathname.startsWith('/my-profile')) return 'My Profile';

    // Specific overrides
    const titleMap: Record<string, string> = {
        '/admin/manage-fleet': 'Manage Fleet',
        '/admin/manage-users': 'Manage Employees',
        '/admin/manage-clients': 'Manage Clients',
        '/admin/manage-jobs': 'Job Management',
        '/admin/manage-tasks': 'Task Management',
        '/admin/manage-requests': 'Time Off Requests',
        '/admin/manage-expenses': 'Expense Management',
        '/admin/manage-violations': 'Violation Management',
        '/admin/manage-calendar': 'Calendar',
        '/admin/operations-map': 'Operations Map',
        '/admin/fleet-health': 'Fleet Health',
        '/admin/manage-inventory': 'Inventory',
        '/admin/manage-documents': 'Policies & Documents',
        '/admin/system-settings': 'System Settings',
        '/weather': 'Weather Center',
        '/help': 'Help & Support',
        '/employee/fleet-check': 'Vehicle Inspection',
        '/employee/time-off': 'Request Time Off',
        '/employee/my-tasks': 'My Tasks',
        '/employee/submit-expense': 'Submit Expense',
    };

    if (titleMap[pathname]) return titleMap[pathname];

    // Fallback: take the last segment and format it
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';

    const lastSegment = segments[segments.length - 1];
    return lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return <FullScreenLoader text="Authenticating..." />;
    }

    if (!user) {
        // This case should ideally be handled by RouteGuard, but as a fallback:
        return <FullScreenLoader text="Redirecting..." />;
    }

    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function FullScreenLoader({ text }: { text: string }) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">{text}</p>
        </div>
    );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const auth = useAuth();

    const [unreadCount, setUnreadCount] = useState(0);
    const { open: openCommandPalette } = useCommandPalette();
    const { open: openTools } = useGlobalTools();
    const [isSidebarDefaultOpen, setIsSidebarDefaultOpen] = useState(true);

    const logout = () => {
        if (auth) {
            auth.signOut();
            router.push('/login');
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedState = document.cookie.split('; ').find(row => row.startsWith('sidebar_state='));
            if (savedState) {
                setIsSidebarDefaultOpen(savedState.split('=')[1] === 'true');
            }
        }
    }, []);

    useEffect(() => {
        if (!user || !user.uid) return;
        const db = getFirestoreInstance();
        const notificationsRef = collection(db, "notifications");

        // Use a map to store notifications from both queries and avoid duplicates
        const allNotifications = new Map<string, NotificationMessage>();

        const updateUnreadCount = () => {
            if (!user) return;
            const count = Array.from(allNotifications.values())
                .filter(notif => !notif.readBy.includes(user.uid))
                .length;
            setUnreadCount(count);
        };

        // Query for notifications sent to 'all'
        const publicQuery = query(notificationsRef, where('recipientId', '==', 'all'));
        const unsubscribePublic = onSnapshot(publicQuery, (snapshot) => {
            snapshot.docs.forEach(doc => {
                allNotifications.set(doc.id, { id: doc.id, ...doc.data() } as NotificationMessage);
            });
            updateUnreadCount();
        }, (error) => {
            console.error("Error fetching public notifications for badge:", error);
        });

        // Query for notifications sent specifically to the current user
        const privateQuery = query(notificationsRef, where('recipientId', '==', user.uid));
        const unsubscribePrivate = onSnapshot(privateQuery, (snapshot) => {
            snapshot.docs.forEach(doc => {
                allNotifications.set(doc.id, { id: doc.id, ...doc.data() } as NotificationMessage);
            });
            updateUnreadCount();
        }, (error) => {
            console.error("Error fetching private notifications for badge:", error);
        });

        return () => {
            unsubscribePublic();
            unsubscribePrivate();
        };
    }, [user]);

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

    const isAdmin = user?.role === 'owner' || user?.role === 'manager';

    return (
        <SidebarProvider defaultOpen={isSidebarDefaultOpen}>
            <Sidebar id="tour-step-sidebar" variant="inset" className="print-hidden">
                <SidebarHeader className="p-4 flex flex-col items-center">
                    <Link href={isAdmin ? '/admin' : '/employee'} className="flex items-center gap-2 mb-4 text-center">
                        <span className="font-headline text-2xl font-bold text-sidebar-primary">Logan's Excavating</span>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    {user?.role === 'employee' && (
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
                                        <SidebarMenuButton tooltip="Policies &amp; Documents" isActive={pathname.startsWith('/employee/company-documents')}>
                                            <BookOpen /><span>Policies &amp; Documents</span>
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

                    {isAdmin && user && (
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
                                <SidebarMenuItem>
                                    <Link href="/admin/operations-map">
                                        <SidebarMenuButton tooltip="Operations Map" isActive={pathname.startsWith('/admin/operations-map')}>
                                            <MapIcon /><span>Operations Map</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            </SidebarMenu>

                            <SidebarMenu>
                                <SidebarMenuSub>
                                    <SidebarMenuButton>
                                        <Users /> People & Comms
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        {user.role === 'owner' && <Link href="/admin/manage-users"><SidebarMenuSubButton>Manage Employees</SidebarMenuSubButton></Link>}
                                        <Link href="/admin/manage-requests"><SidebarMenuSubButton>Time Off Requests</SidebarMenuSubButton></Link>
                                        {user.role === 'owner' && <Link href="/admin/manage-expenses"><SidebarMenuSubButton>Manage Expenses</SidebarMenuSubButton></Link>}
                                        <Link href="/admin/manage-tasks"><SidebarMenuSubButton>Manage Tasks</SidebarMenuSubButton></Link>
                                        <Link href="/admin/manage-violations"><SidebarMenuSubButton>Manage Violations</SidebarMenuSubButton></Link>
                                        <Link href="/admin/personal-documents"><SidebarMenuSubButton>Personal Documents</SidebarMenuSubButton></Link>
                                        <Link href="/admin/send-notification"><SidebarMenuSubButton>Send Notification</SidebarMenuSubButton></Link>
                                    </SidebarMenuSub>
                                </SidebarMenuSub>
                                <SidebarMenuSub>
                                    <SidebarMenuButton>
                                        <Cog /> Assets & Content
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        <Link href="/admin/manage-fleet"><SidebarMenuSubButton>Manage Fleet</SidebarMenuSubButton></Link>
                                        <Link href="/admin/fleet-health"><SidebarMenuSubButton>Fleet Health</SidebarMenuSubButton></Link>
                                        <Link href="/admin/manage-inventory"><SidebarMenuSubButton>Inventory</SidebarMenuSubButton></Link>
                                        <Link href="/admin/manage-documents"><SidebarMenuSubButton>Policies & Docs</SidebarMenuSubButton></Link>
                                        <Link href="/admin/manage-calendar"><SidebarMenuSubButton>Manage Calendar</SidebarMenuSubButton></Link>
                                    </SidebarMenuSub>
                                </SidebarMenuSub>
                                <SidebarMenuSub>
                                    <SidebarMenuButton>
                                        <LineChart /> Ops & Analytics
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        {user.role === 'owner' && <Link href="/admin/manage-clients"><SidebarMenuSubButton>Manage Clients</SidebarMenuSubButton></Link>}
                                        {user.role === 'owner' && <Link href="/admin/manage-jobs"><SidebarMenuSubButton>All Jobs</SidebarMenuSubButton></Link>}
                                        {user.role === 'owner' && <Link href="/admin/manage-rentals"><SidebarMenuSubButton>Manage Rentals</SidebarMenuSubButton></Link>}
                                        <Link href="/admin/manage-snow-routes"><SidebarMenuSubButton>Snow Routes</SidebarMenuSubButton></Link>
                                        <Link href="/reports"><SidebarMenuSubButton>Inspection Reports</SidebarMenuSubButton></Link>
                                        <Link href="/admin/manage-work-orders"><SidebarMenuSubButton>Manage Work Orders</SidebarMenuSubButton></Link>
                                        <Link href="/admin/maintenance-logs"><SidebarMenuSubButton>Maintenance Logs</SidebarMenuSubButton></Link>
                                        {user.role === 'owner' && <Link href="/admin/advanced-reports"><SidebarMenuSubButton>Advanced Reports</SidebarMenuSubButton></Link>}
                                    </SidebarMenuSub>
                                </SidebarMenuSub>
                                {user.role === 'owner' && (
                                    <SidebarMenuItem>
                                        <Link href="/admin/system-settings">
                                            <SidebarMenuButton tooltip="System Settings" isActive={pathname.startsWith('/admin/system-settings')}>
                                                <SlidersHorizontal /><span>System Settings</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                )}
                            </SidebarMenu>
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
                            <SidebarMenuButton tooltip="Calculators" onClick={openTools}>
                                <Calculator />
                                <span>Calculators</span>
                                <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-block">⌘T</kbd>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem id={isAdmin ? "tour-step-sidebar-help" : "tour-step-sidebar-help-employee"}>
                            <Link href="/help">
                                <SidebarMenuButton tooltip="Help &amp; Support" isActive={pathname === '/help'}>
                                    <HelpCircle /><span>Help &amp; Support</span>
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
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6 print-hidden">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-xl font-semibold tracking-tight">{getPageTitle(pathname)}</h1>
                    </div>
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
                    <div key={pathname} className="animate-fade-in-up h-full">
                        {children}
                    </div>
                </main>
            </SidebarInset>
            <CommandPalette />
            <AiAssistantWidget initialOpen={false} />
            <GlobalToolsWidget />
        </SidebarProvider>
    );
}

export default AppLayout;

