
'use client';

import { useState } from 'react';
import type { WorkOrder, MaintenanceLog } from '@/lib/types';
import { updateWorkOrder, addMaintenanceLog, getWorkOrderById } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ClipboardEdit, Check, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ManageWorkOrdersClientPageProps {
  initialOpenOrders: WorkOrder[];
  initialCompletedOrders: WorkOrder[];
}

export default function ManageWorkOrdersClientPage({ initialOpenOrders, initialCompletedOrders }: ManageWorkOrdersClientPageProps) {
  const [openOrders, setOpenOrders] = useState<WorkOrder[]>(initialOpenOrders);
  const [completedOrders, setCompletedOrders] = useState<WorkOrder[]>(initialCompletedOrders);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();

  const handleOpenDialog = (order: WorkOrder) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingOrder) return;

    // Create the maintenance log first if cost is added and it's a completion
    if (editingOrder.status === 'completed' && editingOrder.cost && editingOrder.cost > 0) {
      const newLog: Omit<MaintenanceLog, 'id'> = {
        assetId: editingOrder.assetId,
        assetName: editingOrder.assetName,
        date: new Date().toISOString().split('T')[0],
        serviceType: 'repair',
        description: `Repair from Work Order #${editingOrder.id}: ${editingOrder.issueDescription}`,
        cost: editingOrder.cost,
        mechanic: editingOrder.mechanic,
        workOrderId: editingOrder.id,
      };
      await addMaintenanceLog(newLog);
      toast({ title: 'Maintenance Log Created', description: `A maintenance log for this repair has been automatically created.` });
    }

    await updateWorkOrder(editingOrder.id, {
      status: editingOrder.status,
      mechanicNotes: editingOrder.mechanicNotes,
      cost: editingOrder.cost,
      mechanic: editingOrder.mechanic,
      dateCompleted: editingOrder.status === 'completed' ? new Date().toISOString() : null,
    });

    const updatedOrder = await getWorkOrderById(editingOrder.id);
    if (updatedOrder) {
      setOpenOrders(prev => prev.filter(o => o.id !== editingOrder.id));
      if (updatedOrder.status === 'completed') {
        setCompletedOrders(prev => [updatedOrder, ...prev]);
      } else {
        setOpenOrders(prev => [updatedOrder, ...prev].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()));
      }
    }

    toast({ title: 'Work Order Updated', description: 'The work order has been saved.' });
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const getStatusBadgeVariant = (status: WorkOrder['status']) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'on-hold': return 'outline';
      case 'completed': return 'default';
    }
  };

  const renderTable = (data: WorkOrder[]) => (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Date Created</TableHead><TableHead>Asset</TableHead><TableHead>Issue</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map(order => (
            <TableRow key={order.id}>
              <TableCell>{format(parseISO(order.dateCreated), 'PP')}</TableCell>
              <TableCell>{order.assetName}</TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">{order.issueDescription}</TableCell>
              <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Link href={`/reports/${order.reportId}`}><Button variant="outline" size="icon"><Eye /></Button></Link>
                  <Button variant="outline" size="icon" onClick={() => handleOpenDialog(order)}><Check /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Work Orders" description="View and update work orders generated from failed inspections." icon={ClipboardEdit} />
        <div className="mt-8">
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open ({openOrders.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">
              {openOrders.length > 0 ? renderTable(openOrders) : <EmptyState icon={ClipboardEdit} title="No Open Work Orders" message="Great job, all caught up!" />}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {completedOrders.length > 0 ? renderTable(completedOrders) : <EmptyState icon={ClipboardEdit} title="No Completed Work Orders" />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Work Order #{editingOrder?.id.substring(0, 6)}</DialogTitle>
            <DialogDescription>
              Update the status, add mechanic notes, and log costs for this repair.
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Issue Description</Label>
                <p className="text-sm p-3 bg-muted rounded-md border">{editingOrder.issueDescription}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select value={editingOrder.status} onValueChange={(value) => setEditingOrder({ ...editingOrder, status: value as WorkOrder['status'] })}>
                  <SelectTrigger id="status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mechanic-notes">Mechanic Notes</Label>
                <Textarea id="mechanic-notes" value={editingOrder.mechanicNotes || ''} onChange={(e) => setEditingOrder({ ...editingOrder, mechanicNotes: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input id="cost" type="number" value={editingOrder.cost || ''} onChange={(e) => setEditingOrder({ ...editingOrder, cost: parseFloat(e.target.value) || undefined })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mechanic">Mechanic/Vendor</Label>
                  <Input id="mechanic" value={editingOrder.mechanic || ''} onChange={(e) => setEditingOrder({ ...editingOrder, mechanic: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
