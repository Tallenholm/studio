
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadInventory, saveInventory, loadUsers, loadJobs, loadFleetAssets } from '@/lib/localStorageService';
import type { InventoryItem, User, Job, FleetAsset, InventoryItemType, InventoryItemStatus, AssignmentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Pencil, Hammer, Filter, CheckCircle, PackagePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  type: z.enum(['tool', 'material', 'consumable'], { required_error: 'Item type is required.' }),
  category: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

const assignmentSchema = z.object({
    assignedToType: z.enum(['employee', 'job', 'vehicle'], { required_error: 'Please select an assignment type.' }),
    assignedToId: z.string({ required_error: 'Please select an entity to assign to.' }),
});

export default function ManageInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [assigningItem, setAssigningItem] = useState<InventoryItem | null>(null);
  
  const { toast } = useToast();

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const addEditForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
  });

  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
  });

  useEffect(() => {
    setIsMounted(true);
    setInventory(loadInventory());
    setUsers(loadUsers());
    setJobs(loadJobs());
    setFleetAssets(loadFleetAssets());
  }, []);
  
  useEffect(() => {
    if(isMounted) {
      saveInventory(inventory);
    }
  }, [inventory, isMounted]);

  const handleAddEditDialogChange = (open: boolean) => {
    setIsAddEditDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      addEditForm.reset({ name: '', type: undefined, category: '', quantity: 1 });
    }
  };

  const handleAssignDialogChange = (open: boolean) => {
    setIsAssignDialogOpen(open);
    if (!open) {
      setAssigningItem(null);
      assignmentForm.reset();
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    addEditForm.reset(item);
    setIsAddEditDialogOpen(true);
  };

  const handleAssignClick = (item: InventoryItem) => {
    setAssigningItem(item);
    setIsAssignDialogOpen(true);
  };
  
  function onAddEditSubmit(values: z.infer<typeof itemSchema>) {
    if (editingItem) {
      const updatedItems = inventory.map(i => i.id === editingItem.id ? { ...i, ...values } : i);
      setInventory(updatedItems.sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: 'Item Updated', description: `Item "${values.name}" has been updated.` });
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        status: 'available',
        ...values,
      };
      setInventory(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: 'Item Added', description: `Item "${values.name}" has been added.` });
    }
    handleAddEditDialogChange(false);
  }

  function onAssignmentSubmit(values: z.infer<typeof assignmentSchema>) {
    if (!assigningItem) return;

    let assignedToName = '';
    let assignedEntity: User | Job | FleetAsset | undefined;
    if (values.assignedToType === 'employee') {
        assignedEntity = users.find(u => u.id === values.assignedToId);
    } else if (values.assignedToType === 'job') {
        assignedEntity = jobs.find(j => j.id === values.assignedToId);
    } else if (values.assignedToType === 'vehicle') {
        assignedEntity = fleetAssets.find(a => a.id === values.assignedToId);
    }
    assignedToName = assignedEntity?.name || 'Unknown';
    
    const updatedItems = inventory.map(i => i.id === assigningItem.id ? { 
        ...i, 
        status: 'in_use',
        assignedToType: values.assignedToType,
        assignedToId: values.assignedToId,
        assignedToName
    } : i);

    setInventory(updatedItems);
    toast({ title: 'Item Assigned', description: `"${assigningItem.name}" assigned to ${assignedToName}.` });
    handleAssignDialogChange(false);
  }
  
  const handleCheckIn = (item: InventoryItem) => {
    const updatedItems = inventory.map(i => i.id === item.id ? { 
        ...i, 
        status: 'available',
        assignedToType: undefined,
        assignedToId: undefined,
        assignedToName: undefined
    } : i);
    setInventory(updatedItems);
    toast({ title: 'Item Checked In', description: `"${item.name}" is now available.` });
  };

  function removeItem(itemId: string) {
    const itemToRemove = inventory.find(i => i.id === itemId);
    setInventory(prev => prev.filter(i => i.id !== itemId));
    toast({ title: 'Item Removed', description: `"${itemToRemove?.name}" has been deleted.`, variant: 'destructive' });
  }

  const assignmentType = assignmentForm.watch('assignedToType');

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
        const typeMatch = typeFilter === 'all' || item.type === typeFilter;
        const statusMatch = statusFilter === 'all' || item.status === statusFilter;
        return typeMatch && statusMatch;
    });
  }, [inventory, typeFilter, statusFilter]);

  const getStatusBadgeVariant = (status: InventoryItemStatus) => {
    switch (status) {
        case 'available': return 'default';
        case 'in_use': return 'secondary';
        case 'maintenance': return 'destructive';
        case 'lost': return 'outline';
    }
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Inventory...</p>
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
                <Hammer className="h-8 w-8 text-primary" />
                Manage Inventory
              </CardTitle>
              <CardDescription className="mt-2">
                Track tools, materials, and consumables. Assign items to jobs or employees.
              </CardDescription>
            </div>
            <Dialog open={isAddEditDialogOpen} onOpenChange={handleAddEditDialogChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Inventory Item'}</DialogTitle>
                </DialogHeader>
                <Form {...addEditForm}>
                  <form onSubmit={addEditForm.handleSubmit(onAddEditSubmit)} className="space-y-4 py-4">
                    <FormField control={addEditForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl><Input placeholder="e.g., DeWalt Circular Saw" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={addEditForm.control} name="type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="consumable">Consumable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addEditForm.control} name="quantity" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                     <FormField control={addEditForm.control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g., Power Tools, Safety Gear" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="submit">Save Item</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <Card className="bg-muted/30">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by type..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="consumable">Consumable</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="in_use">In Use</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                             <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

          <Card>
            <CardContent className="p-0">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length > 0 ? filteredInventory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.category || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.status)} className={cn(item.status === 'available' && 'bg-primary')}>
                                {item.status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.assignedToName || '---'}</TableCell>
                        <TableCell className="text-right">
                            {item.status === 'available' ? (
                                <Button variant="outline" size="sm" onClick={() => handleAssignClick(item)}>
                                    <PackagePlus className="mr-2 h-4 w-4" />Assign
                                </Button>
                            ) : (
                                <Button variant="secondary" size="sm" onClick={() => handleCheckIn(item)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />Check In
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">No inventory items match the current filters.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={handleAssignDialogChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assign Item: {assigningItem?.name}</DialogTitle>
                <DialogDescription>Check out this item to an employee, job, or vehicle.</DialogDescription>
            </DialogHeader>
            <Form {...assignmentForm}>
                <form onSubmit={assignmentForm.handleSubmit(onAssignmentSubmit)} className="space-y-4 py-4">
                    <FormField control={assignmentForm.control} name="assignedToType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); assignmentForm.resetField('assignedToId'); }} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="job">Job</SelectItem>
                                    <SelectItem value="vehicle">Vehicle</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    {assignmentType && (
                        <FormField control={assignmentForm.control} name="assignedToId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select {assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder={`Select a ${assignmentType}...`} /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {assignmentType === 'employee' && users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                        {assignmentType === 'job' && jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                                        {assignmentType === 'vehicle' && fleetAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={!assignmentType}>Assign Item</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
