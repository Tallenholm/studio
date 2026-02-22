
'use client';

import { useState, useMemo } from 'react';
import type { MaintenanceLog, FleetAsset } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '@/lib/firestoreService';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Pencil, Wrench, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/common/EmptyState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const logSchema = z.object({
  assetId: z.string({ required_error: 'Please select an asset.' }),
  date: z.date({ required_error: 'A service date is required.' }),
  serviceType: z.enum(['routine', 'repair', 'inspection', 'other'], { required_error: 'Service type is required.' }),
  description: z.string().min(1, 'Description is required.'),
  cost: z.coerce.number().optional(),
  mechanic: z.string().optional(),
});

interface MaintenanceLogsClientPageProps {
  initialAssets: FleetAsset[];
  initialLogs: MaintenanceLog[];
}

export default function MaintenanceLogsClientPage({ initialAssets, initialLogs }: MaintenanceLogsClientPageProps) {
  const [assets] = useState<FleetAsset[]>(initialAssets);
  const [logs, setLogs] = useState<MaintenanceLog[]>(initialLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<MaintenanceLog | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingLog(null);
      form.reset({
        assetId: '',
        serviceType: undefined,
        description: '',
        cost: undefined,
        mechanic: '',
      });
    }
  };

  const handleEditClick = (log: MaintenanceLog) => {
    setEditingLog(log);
    form.reset({
      ...log,
      date: parseISO(log.date),
    });
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof logSchema>) {
    const asset = assets.find(a => a.id === values.assetId);
    if (!asset) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected asset not found.' });
      return;
    }

    const logData = {
      ...values,
      assetName: asset.name,
      date: format(values.date, 'yyyy-MM-dd'),
    };

    if (editingLog) {
      await updateMaintenanceLog(editingLog.id, logData);
      setLogs(prev => prev.map(l => (l.id === editingLog.id ? { ...l, ...logData } : l)));
      toast({ title: 'Log Updated', description: 'The maintenance log has been updated.' });
    } else {
      const newId = await addMaintenanceLog(logData);
      setLogs(prev => [{ id: newId, ...logData }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Log Added', description: 'A new maintenance log has been created.' });
    }
    handleDialogOpenChange(false);
  }

  async function removeLog(logId: string) {
    const logToRemove = logs.find(l => l.id === logId);
    await deleteMaintenanceLog(logId);
    setLogs(prev => prev.filter(l => l.id !== logId));
    toast({ title: 'Log Deleted', description: `Log for ${logToRemove?.assetName} has been deleted.`, variant: 'destructive' });
  }
  
  const assetNameMap = useMemo(() => new Map(assets.map(a => [a.id, a.name])), [assets]);

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Maintenance Logs" description="View and manage the service history for all fleet assets." icon={Wrench}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-5 w-5" />Log New Service</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLog ? 'Edit Maintenance Log' : 'Log New Service'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField control={form.control} name="assetId" render={({ field }) => (
                        <FormItem><FormLabel>Asset</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an asset..." /></SelectTrigger></FormControl><SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Date of Service</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-auto h-4 w-4 opacity-50" />{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="serviceType" render={({ field }) => (
                      <FormItem><FormLabel>Service Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="repair">Repair</SelectItem><SelectItem value="inspection">Inspection</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Oil change and filter replacement" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" placeholder="e.g., 150.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="mechanic" render={({ field }) => (<FormItem><FormLabel>Mechanic/Vendor</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <DialogFooter><Button type="submit">Save Log</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>
        
        <div className="mt-8 animate-fade-in-up">
            {logs.length > 0 ? (
                <div className="border rounded-md bg-card">
                    <Table>
                        <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Date</TableHead><TableHead>Service Type</TableHead><TableHead>Description</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {logs.map(log => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">{assetNameMap.get(log.assetId) || log.assetName}</TableCell>
                                <TableCell>{format(parseISO(log.date), 'PP')}</TableCell>
                                <TableCell className="capitalize">{log.serviceType}</TableCell>
                                <TableCell className="text-muted-foreground max-w-sm truncate">{log.description}</TableCell>
                                <TableCell>{log.cost ? `$${log.cost.toFixed(2)}` : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleEditClick(log)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setLogToDelete(log)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <EmptyState icon={Wrench} title="No Maintenance Logs Found" message="Click 'Log New Service' to add the first record." onAction={() => setIsDialogOpen(true)} actionLabel="Log New Service" />
            )}
        </div>
      </div>
      <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this maintenance log. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(logToDelete) removeLog(logToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
