

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getClients, addClient, updateClient, deleteClient, getJobs } from '@/lib/firestoreService';
import type { Client, Job } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

   useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [initialClients, initialJobs] = await Promise.all([
                getClients(),
                getJobs()
            ]);
            setClients(initialClients.sort((a,b) => a.name.localeCompare(b.name)));
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
        ).sort((a,b) => a.name.localeCompare(b.name))
      );
      toast({ title: 'Client Updated', description: `Client "${values.name}" has been updated.` });
    } else {
      const newClientId = await addClient(values);
      const newClient = { id: newClientId, ...values };
      setClients(prev => [...prev, newClient].sort((a,b) => a.name.localeCompare(b.name)));
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
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading Clients...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Manage Clients
              </CardTitle>
              <CardDescription className="mt-2">
                Add, view, and remove client information.
              </CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, contact, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {clientsWithStats.length > 0 ? (
              <div className="border rounded-md">
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
                                      <DropdownMenuItem onClick={() => handleEditClick(client)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => removeClient(client.id)} className="text-destructive">
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
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-primary/70" />
              <h3 className="text-xl font-semibold text-foreground">{searchTerm ? 'No Matching Clients' : 'No Clients Found'}</h3>
              <p className="mt-2">{searchTerm ? 'Try a different search term.' : 'Click "Add New Client" to get started.'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
