
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Home, Edit3, Car, FileText, Settings, HelpCircle, LogOut, Tractor, AlertTriangle, ShieldCheck, Users, LineChart, Cog } from 'lucide-react';
import Image from 'next/image';

const userNavItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/vin-entry', label: 'VIN Entry', icon: Edit3 },
  { href: '/pre-trip', label: 'Pre-Trip Inspection', icon: Car },
  { href: '/post-trip', label: 'Post-Trip Inspection', icon: Car },
  { href: '/reports', label: 'Inspection Reports', icon: FileText },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin Overview', icon: ShieldCheck },
  { href: '/admin/manage-fleet', label: 'Manage Fleet', icon: Users },
  { href: '/admin/advanced-reports', label: 'Advanced Reports', icon: LineChart },
  { href: '/admin/system-settings', label: 'System Settings', icon: Cog },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-col items-center">
           <Link href="/" className="flex items-center gap-2 mb-4">
            <Tractor className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold">Fleet Check</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {userNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, className: "font-body" }}
                    aria-label={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarSeparator className="my-4" />
          
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2">Admin Section</SidebarGroupLabel>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)} 
                      tooltip={{ children: item.label, className: "font-body" }}
                      aria-label={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter className="p-2">
            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/help" passHref legacyBehavior>
                        <SidebarMenuButton 
                            isActive={pathname === '/help'}
                            tooltip={{ children: "Help", className: "font-body"}} 
                            aria-label="Help">
                            <HelpCircle />
                            <span>Help</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                     <SidebarMenuButton tooltip={{ children: "Logout (Not Implemented)", className: "font-body"}} aria-label="Logout" disabled>
                        <LogOut />
                        <span>Logout</span>
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
