
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadWorkOrders, saveWorkOrders, loadMaintenanceLogs, saveMaintenanceLogs } from '@/lib/localStorageService';
import type { WorkOrder, MaintenanceLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ClipboardEdit, Loader2, Pencil, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const workOrderSchema = z.object({
  status: z.enum(['open', 'in-progress', 'completed', 'on-hold']),
  mechanicNotes: z.string().optional(),
  cost: z.coerce.number().optional(),
  mechanic: z.string().optional(),
});

export default function ManageWorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof workOrderSchema>>({
    resolver: zodResolver(workOrderSchema),
  });

  useEffect(() => {
    setIsMounted(true);
    setWorkOrders(loadWorkOrders().sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
  }, []);

  const handleEditClick = (order: WorkOrder) => {
    setEditingOrder(order);
    form.reset({
      status: order.status,
      mechanicNotes: order.mechanicNotes || '',
      cost: order.cost || undefined,
      mechanic: order.mechanic || '',
    });
  };

  const handleDialogClose = () => {
    setEditingOrder(null);
    form.reset();
  };

  function onSubmit(values: z.infer<typeof workOrderSchema>) {
    if (!editingOrder) return;

    const wasJustCompleted = values.status === 'completed' && editingOrder.status !== 'completed';

    const updatedOrder: WorkOrder = {
      ...editingOrder,
      ...values,
      dateCompleted: wasJustCompleted ? new Date().toISOString() : editingOrder.dateCompleted,
    };
    
    const updatedOrders = workOrders.map(wo => wo.id === updatedOrder.id ? updatedOrder : wo);
    setWorkOrders(updatedOrders);
    saveWorkOrders(updatedOrders);
    
    let toastDescription = `Status for ${updatedOrder.assetName} has been updated.`;

    // Automatically create a maintenance log when the order is first completed
    if (wasJustCompleted) {
        const maintenanceLogs = loadMaintenanceLogs();
        const logAlreadyExists = maintenanceLogs.some(log => log.workOrderId === updatedOrder.id);
        
        if (!logAlreadyExists) {
            const newLog: MaintenanceLog = {
                id: `mlog-${Date.now()}`,
                workOrderId: updatedOrder.id,
                assetId: updatedOrder.assetId,
                assetName: updatedOrder.assetName,
                date: new Date().toISOString().split('T')[0],
                serviceType: 'repair',
                description: `Work order repair: ${updatedOrder.issueDescription}\nNotes: ${values.mechanicNotes || 'N/A'}`,
                cost: values.cost,
                mechanic: values.mechanic,
            };
            saveMaintenanceLogs([...maintenanceLogs, newLog]);
            toastDescription += ' A maintenance log was automatically created.';
        }
    }
    
    toast({ title: 'Work Order Updated', description: toastDescription });
    handleDialogClose();
  }

  const getStatusBadgeVariant = (status: WorkOrder['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'open': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'on-hold': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: WorkOrder['status']) => {
      return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const renderWorkOrdersTable = (orders: WorkOrder[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.assetName}</TableCell>
                    <TableCell>
                       <Badge variant={getStatusBadgeVariant(order.status)} className={order.status === 'completed' ? 'bg-green-600' : ''}>
                        {getStatusLabel(order.status)}
                       </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.dateCreated), 'PPP')}</TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">{order.issueDescription}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" asChild>
                         <Link href={`/reports/${order.reportId}`} title="View Original Report">
                            <Eye className="h-4 w-4" />
                         </Link>
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleEditClick(order)} aria-label={`Edit work order for ${order.assetName}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} found.</div>
        )}
      </CardContent>
    </Card>
  );

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Work Orders...</p>
      </div>
    );
  }

  const openWorkOrders = workOrders.filter(wo => wo.status !== 'completed');
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed');

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <ClipboardEdit className="h-8 w-8 text-primary" />
            Manage Work Orders
          </CardTitle>
          <CardDescription>
            Track and manage maintenance work orders generated from failed inspections.
          </CardDescription>
        </CardHeader>
      </Card>

      {renderWorkOrdersTable(openWorkOrders, 'Open Work Orders')}
      {renderWorkOrdersTable(completedWorkOrders, 'Completed Work Orders')}

       <Dialog open={!!editingOrder} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Update Work Order</DialogTitle>
              <DialogDescription>
                Update the status and add details for the work order on: <span className="font-bold">{editingOrder?.assetName}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <p className="font-semibold">Original Issue:</p>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{editingOrder?.issueDescription}</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="on-hold">On Hold</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Cost (Optional)</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="e.g., 250.00" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>
                <FormField
                    control={form.control}
                    name="mechanic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mechanic / Service Provider (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., In-house, City Auto" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mechanicNotes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mechanic Notes</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describe the work performed, parts used, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
