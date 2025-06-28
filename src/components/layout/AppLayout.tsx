
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
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, HelpCircle, LogOut, Bell, Users, Cog, Loader2, Truck, LayoutDashboard, Calendar, ClipboardCheck, Send, ShieldAlert, CalendarPlus, BookCopy, LineChart, SlidersHorizontal, Wrench, ClipboardList, Receipt, Coins, Briefcase, Building2, ClipboardEdit, Files, FileBadge, HeartPulse, Snowflake, Droplets, Package, Calculator, Hammer, Route } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadFleetAssets, loadNotifications, saveNotifications } from '@/lib/localStorageService';
import type { NotificationMessage, UserRole, FleetAsset } from '@/lib/types';
import AiAssistantWidget from '@/components/common/AiAssistantWidget';
import CommandPalette from '@/components/common/CommandPalette';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { format, isBefore, addDays, parseISO, addMonths } from 'date-fns';

const FullScreenLoader = ({ text = 'Loading...' }: { text?: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{text}</p>
    </div>
);

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const searchParams = useSearchParams();
    const showAiAssistantWelcome = searchParams.get('tour') === 'true';
    const { open } = useCommandPalette();

    useEffect(() => {
        if (user) {
            const notifications = loadNotifications();
            const userNotifications = notifications.filter(
                notif => notif.recipientId === 'all' || notif.recipientId === user.id
            );
            const count = userNotifications.filter(notif => !notif.readBy.includes(user.id)).length;
            setUnreadCount(count);
        }
    }, [user, pathname]); // Re-check on navigation
    
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          open()
        }
      }
      document.addEventListener("keydown", down)
      return () => document.removeEventListener("keydown", down)
    }, [open])

    useEffect(() => {
        if (user && (user.role === 'owner' || user.role === 'manager')) {
            const checkAndCreateNotifications = () => {
                const assets = loadFleetAssets();
                const notifications = loadNotifications();
                let notificationsChanged = false;

                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
                const thirtyDaysFromNow = addDays(today, 30);

                assets.forEach(asset => {
                    // Check registration
                    if (asset.registrationDueDate) {
                        const dueDate = parseISO(asset.registrationDueDate);
                        const notifId = `expiry-reg-${asset.id}`;
                        if (isBefore(dueDate, thirtyDaysFromNow) && !notifications.some(n => n.id === notifId)) {
                            const isExpired = isBefore(dueDate, today);
                            notifications.push({
                                id: notifId, recipientId: 'all', title: `Vehicle Registration ${isExpired ? 'Expired' : 'Expiring Soon'}`,
                                content: `The registration for ${asset.name} (${asset.vin}) ${isExpired ? 'expired' : 'expires'} on ${format(dueDate, 'PPP')}. Please update it in Manage Fleet.`,
                                senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [],
                            });
                            notificationsChanged = true;
                        }
                    }

                    // Check insurance
                    if (asset.insuranceDueDate) {
                        const dueDate = parseISO(asset.insuranceDueDate);
                        const notifId = `expiry-ins-${asset.id}`;
                         if (isBefore(dueDate, thirtyDaysFromNow) && !notifications.some(n => n.id === notifId)) {
                            const isExpired = isBefore(dueDate, today);
                            notifications.push({
                                id: notifId, recipientId: 'all', title: `Vehicle Insurance ${isExpired ? 'Expired' : 'Expiring Soon'}`,
                                content: `The insurance for ${asset.name} (${asset.vin}) ${isExpired ? 'expired' : 'expires'} on ${format(dueDate, 'PPP')}. Please update it in Manage Fleet.`,
                                senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [],
                            });
                            notificationsChanged = true;
                        }
                    }

                    // Check maintenance schedule
                    if (asset.maintenanceSchedule) {
                        for (const [key, value] of Object.entries(asset.maintenanceSchedule)) {
                            if (value && value.intervalMonths && value.lastServiceDate) {
                                const nextDueDate = addMonths(parseISO(value.lastServiceDate), value.intervalMonths);
                                const serviceName = key.replace(/([A-Z])/g, ' $1').trim();
                                const notifId = `maint-${key}-${asset.id}`;

                                if (isBefore(nextDueDate, thirtyDaysFromNow) && !notifications.some(n => n.id === notifId)) {
                                    const isOverdue = isBefore(nextDueDate, today);
                                    notifications.push({
                                        id: notifId, recipientId: 'all', title: `Maintenance ${isOverdue ? 'Overdue' : 'Due Soon'}: ${serviceName}`,
                                        content: `The ${serviceName} for ${asset.name} (${asset.vin}) is ${isOverdue ? 'overdue' : 'due'} on ${format(nextDueDate, 'PPP')}. Please log the service once completed.`,
                                        senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [],
                                    });
                                    notificationsChanged = true;
                                }
                            }
                        }
                    }
                });

                if (notificationsChanged) {
                    saveNotifications(notifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                    // Force a re-render to update unread count
                    const userNotifications = notifications.filter(notif => notif.recipientId === 'all' || notif.recipientId === user.id);
                    const count = userNotifications.filter(notif => !notif.readBy.includes(user.id)).length;
                    setUnreadCount(count);
                }
            };
            checkAndCreateNotifications();
        }
    }, [user, pathname]);


    if (!user) {
        return <FullScreenLoader text="Redirecting..." />;
    }

    const isAdmin = user.role === 'owner' || user.role === 'manager';
    
    return (
        <SidebarProvider defaultOpen>
            <Sidebar id="tour-step-sidebar" variant="inset">
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
                                        <SidebarMenuButton tooltip="General Documents" isActive={pathname.startsWith('/admin/manage-documents')}>
                                            <BookCopy /><span>General Documents</span>
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
                                        <SidebarMenuButton tooltip="Fleet Tools" isActive={pathname.startsWith('/admin/fleet-tools')}>
                                            <Calculator /><span>Fleet Tools</span>
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
                           <Button variant="ghost" className="w-full justify-start" onClick={open}>
                             <span className="mr-auto">Search...</span>
                             <kbd className="ml-4 hidden rounded bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-block">⌘K</kbd>
                           </Button>
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
            <CommandPalette />
            <AiAssistantWidget initialOpen={showAiAssistantWelcome} />
        </SidebarProvider>
    );
}

const PUBLIC_PATHS = ['/login'];
// Paths exclusively for Owners.
const OWNER_ONLY_PATHS = [
    '/admin/manage-users',
    '/admin/manage-expenses',
    '/admin/manage-clients',
    '/admin/manage-jobs',
    '/admin/manage-snow',
    '/admin/manage-snow-routes',
    '/admin/manage-concrete',
    '/admin/manage-misc',
    '/admin/advanced-reports',
    '/admin/system-settings',
];
// Paths for ANY authenticated user.
const SHARED_AUTH_PATHS = [
    '/help',
    '/notifications',
    '/reports'
];
// Paths for employees (and by extension, managers and owners).
const EMPLOYEE_PATHS = [
    '/employee',
    '/pre-trip',
    '/post-trip'
];

function isPathAllowed(pathname: string, role: UserRole | 'guest'): boolean {
    if (role === 'guest') {
        // Guest can only see public paths.
        return PUBLIC_PATHS.some(p => pathname.startsWith(p));
    }
    
    if (role === 'owner') {
        // Owner can see everything.
        return true; 
    }
    
    // Check if path is in one of the allowed lists for all users
    if (SHARED_AUTH_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/reports/')) {
        return true;
    }
    
    if (role === 'employee') {
        // Employees can only see their designated paths.
        return EMPLOYEE_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/employee/');
    }

    if (role === 'manager') {
        // A manager CANNOT see owner-only paths.
        if (OWNER_ONLY_PATHS.some(p => pathname.startsWith(p))) {
            return false;
        }
        // A manager CAN see any admin path that isn't owner-only.
        if (pathname.startsWith('/admin')) {
            return true;
        }
        // A manager CAN see all employee paths.
        if (EMPLOYEE_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/employee/')) {
            return true;
        }
    }

    // Deny by default
    return false;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isRouteChecked, setIsRouteChecked] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        const role = user?.role || 'guest';
        
        let destination: string | null = null;

        if (user) {
            // User is logged in
            if (PUBLIC_PATHS.includes(pathname) || pathname === '/') {
                destination = role === 'employee' ? '/employee' : '/admin';
            } else if (!isPathAllowed(pathname, role)) {
                // Logged in user on a forbidden path, send to their hub
                destination = role === 'employee' ? '/employee' : '/admin';
            }
        } else {
            // User is not logged in
            if (!PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
                destination = '/login';
            }
        }

        if (destination) {
            router.replace(destination);
        } else {
            setIsRouteChecked(true); // Path is allowed, stop loading
        }
    }, [isLoading, user, pathname, router]);


    if (isLoading || !isRouteChecked) {
        return <FullScreenLoader />;
    }

    if (!user && PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return <>{children}</>;
    }
    
    if (user) {
        return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
    }

    return <FullScreenLoader />;
}
