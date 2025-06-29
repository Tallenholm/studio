
'use client';

import { useEffect, useState } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { useRouter } from 'next/navigation';
import { loadFleetAssets } from '@/lib/localStorageService';
import { getJobs, getClients } from '@/lib/firestoreService';
import type { Job, Client, FleetAsset, JobType } from '@/lib/types';
import { LayoutDashboard, Users, Truck, Briefcase, Building2, FileText, Cog, Snowflake, Droplets, Package, Hammer, Route } from 'lucide-react';

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assets, setAssets] = useState<FleetAsset[]>([]);

  useEffect(() => {
    setIsMounted(true);
    // Load data when the palette is opened to ensure it's fresh
    if (isOpen) {
        getJobs().then(setJobs);
        getClients().then(setClients);
        setAssets(loadFleetAssets());
    }
  }, [isOpen]);

  const runCommand = (command: () => unknown) => {
    close();
    command();
  };

  if (!isMounted) {
    return null;
  }

  const pages = [
    { name: 'Admin Dashboard', href: '/admin', icon: <LayoutDashboard /> },
    { name: 'Manage Employees', href: '/admin/manage-users', icon: <Users /> },
    { name: 'Manage Fleet', href: '/admin/manage-fleet', icon: <Truck /> },
    { name: 'Manage Inventory', href: '/admin/manage-inventory', icon: <Hammer /> },
    { name: 'Excavation Jobs', href: '/admin/manage-jobs', icon: <Briefcase /> },
    { name: 'Snow Contracts', href: '/admin/manage-snow', icon: <Snowflake /> },
    { name: 'Snow Routes', href: '/admin/manage-snow-routes', icon: <Route /> },
    { name: 'Concrete Jobs', href: '/admin/manage-concrete', icon: <Droplets /> },
    { name: 'Misc. Jobs', href: '/admin/manage-misc', icon: <Package /> },
    { name: 'Manage Clients', href: '/admin/manage-clients', icon: <Building2 /> },
    { name: 'View Reports', href: '/reports', icon: <FileText /> },
    { name: 'System Settings', href: '/admin/system-settings', icon: <Cog /> },
  ];
  
  const getJobIcon = (jobType: Job['jobType']) => {
      switch(jobType) {
          case 'excavation': return <Briefcase />;
          case 'snow_removal': return <Snowflake />;
          case 'concrete': return <Droplets />;
          case 'misc': return <Package />;
          default: return <Briefcase />;
      }
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Pages">
          {pages.map(page => (
            <CommandItem key={page.href} onSelect={() => runCommand(() => router.push(page.href))}>
              {page.icon}
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Jobs">
          {jobs.map(job => (
            <CommandItem key={`job-${job.id}`} onSelect={() => runCommand(() => router.push(`/admin/jobs/${job.id}`))}>
              {getJobIcon(job.jobType)}
              <span>{job.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Clients">
          {clients.map(client => (
            <CommandItem key={`client-${client.id}`} onSelect={() => runCommand(() => router.push(`/admin/manage-clients`))}>
              <Building2 />
              <span>{client.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Fleet">
          {assets.map(asset => (
            <CommandItem key={`asset-${asset.id}`} onSelect={() => runCommand(() => router.push(`/admin/manage-fleet`))}>
              <Truck />
              <span>{asset.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
