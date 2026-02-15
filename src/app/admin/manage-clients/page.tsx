

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getClients, addClient, updateClient, deleteClient, getJobs } from '@/lib/firestoreService';
import type { Client, Job } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import EmptyState from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Building2, Pencil, MoreHorizontal, Loader2, Search, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required.'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});


export default function ManageClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [initialClients, initialJobs] = await Promise.all([
          getClients(),
          getJobs()
        ]);
        setClients(initialClients.sort((a, b) => a.name.localeCompare(b.name)));
        setJobs(initialJobs);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load client data.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const clientsWithStats = useMemo(() => {
    return clients
      .map(client => {
        const clientJobs = jobs.filter(job => job.clientId === client.id);
        const totalValue = clientJobs.reduce((sum, job) => sum + (job.jobValue || 0), 0);
        return {
          ...client,
          jobCount: clientJobs.length,
          totalValue: totalValue,
        };
      })
      .filter(client => {
        const search = searchTerm.toLowerCase();
        return (
          client.name.toLowerCase().includes(search) ||
          (client.contactPerson && client.contactPerson.toLowerCase().includes(search)) ||
          (client.contactEmail && client.contactEmail.toLowerCase().includes(search)) ||
          (client.contactPhone && client.contactPhone.toLowerCase().includes(search))
        );
      });
  }, [clients, jobs, searchTerm]);


  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setEditingClient(null);
    }
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    form.reset(client);
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof clientSchema>) {
    if (editingClient) {
      await updateClient(editingClient.id, values);
      setClients(prevClients =>
        prevClients.map(c =>
          c.id === editingClient.id ? { ...c, ...values } : c
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({ title: 'Client Updated', description: `Client "${values.name}" has been updated.` });
    } else {
      const newClientId = await addClient(values);
      const newClient = { id: newClientId, ...values };
      setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Client Added', description: `Client "${values.name}" has been added.` });
    }
    handleDialogOpenChange(false);
  }

  async function removeClient(clientId: string) {
    const clientHasJobs = jobs.some(job => job.clientId === clientId);
    if (clientHasJobs) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete Client',
        description: 'This client has active or past jobs and cannot be removed.',
      });
      return;
    }

    const clientToRemove = clients.find(c => c.id === clientId);
    await deleteClient(clientId);
    setClients((prev) => prev.filter((client) => client.id !== clientId));
    toast({
      title: 'Client Removed',
      description: `Client "${clientToRemove?.name}" has been removed.`,
      variant: 'destructive',
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader
          title="Manage Clients"
          description="Add, view, and remove client information."
          icon={Building2}
        >
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Update the details for this client.' : 'Enter the details for a new client.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Street Properties" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Bob Vance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="e.g., contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Save Client</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="mt-8 animate-fade-in-up space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, contact, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {clientsWithStats.length > 0 ? (
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Total Billed</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsWithStats.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">{client.contactPerson || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.contactEmail ? (
                          <Link href={`mailto:${client.contactEmail}`} className="hover:underline">{client.contactEmail}</Link>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.contactPhone ? (
                          <Link href={`tel:${client.contactPhone}`} className="hover:underline">{client.contactPhone}</Link>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.jobCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(client.totalValue)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(client)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setClientToDelete(client)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title={searchTerm ? 'No Matching Clients' : 'No Clients Found'}
              message={searchTerm ? 'Try a different search term.' : 'Click "Add New Client" to get started.'}
              actionLabel={!searchTerm ? "Add New Client" : undefined}
              onAction={!searchTerm ? () => setIsDialogOpen(true) : undefined}
            />
          )}
        </div>
      </div>
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              <span className="font-bold"> {clientToDelete?.name} </span>
              and all associated data. Deleting a client is only possible if they have no associated jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (clientToDelete) {
                  removeClient(clientToDelete.id);
                }
              }}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
