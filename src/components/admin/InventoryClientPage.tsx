'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { InventoryItem, User, Job, FleetAsset, InventoryItemType, InventoryItemStatus, AssignmentType } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Pencil, Hammer, Filter, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/firestoreService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


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

interface InventoryClientPageProps {
    initialInventory: InventoryItem[];
    initialUsers: User[];
    initialJobs: Job[];
    initialFleetAssets: FleetAsset[];
}

export default function InventoryClientPage({ initialInventory, initialUsers, initialJobs, initialFleetAssets }: InventoryClientPageProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [users] = useState<User[]>(initialUsers);
  const [jobs] = useState<Job[]>(initialJobs);
  const [fleetAssets] = useState<FleetAsset[]>(initialFleetAssets);

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [assigningItem, setAssigningItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  
  const { toast } = useToast();

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const addEditForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
  });

  const assignmentForm = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
  });

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
  
  async function onAddEditSubmit(values: z.infer<typeof itemSchema>) {
    if (editingItem) {
      const dataToUpdate: Partial<InventoryItem> = { ...values };
      await updateInventoryItem(editingItem.id, dataToUpdate);

      setInventory(prevInventory =>
        prevInventory.map(i => {
          if (i.id === editingItem.id) {
            return { ...i, ...values }; // Correctly merge form values with the full existing item
          }
          return i;
        })
      );
      toast({ title: 'Item Updated', description: `Item "${values.name}" has been updated.` });
    } else {
      const newItemData: Omit<InventoryItem, 'id'> = {
        status: 'available',
        ...values,
      };
      const newId = await addInventoryItem(newItemData);
      setInventory(prev => [...prev, {id: newId, ...newItemData}].sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: 'Item Added', description: `Item "${values.name}" has been added.` });
    }
    handleAddEditDialogChange(false);
  }

  async function onAssignmentSubmit(values: z.infer<typeof assignmentSchema>) {
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
    
    await updateItemStatus(assigningItem.id, 'in_use', {
      assignedToType: values.assignedToType,
      assignedToId: values.assignedToId,
      assignedToName
    });

    toast({ title: 'Item Assigned', description: `"${assigningItem.name}" assigned to ${assignedToName}.` });
    handleAssignDialogChange(false);
  }

  const updateItemStatus = async (itemId: string, newStatus: InventoryItemStatus, assignmentInfo?: Partial<InventoryItem>) => {
    const itemToUpdate = inventory.find(i => i.id === itemId);
    if (!itemToUpdate) return;
    
    const isNowInUse = newStatus === 'in_use';
    
    const updateData: Partial<InventoryItem> = {
        status: newStatus,
        assignedToType: isNowInUse ? assignmentInfo?.assignedToType : undefined,
        assignedToId: isNowInUse ? assignmentInfo?.assignedToId : undefined,
        assignedToName: isNowInUse ? assignmentInfo?.assignedToName : undefined,
    };

    await updateInventoryItem(itemId, updateData);

    setInventory(prevInventory =>
      prevInventory.map(item => {
          if (item.id === itemId) {
              const updatedItem: InventoryItem = {
                  ...item, // Carry over all old properties
                  status: newStatus, // Set the new status
                  assignedToType: isNowInUse ? assignmentInfo?.assignedToType : undefined,
                  assignedToId: isNowInUse ? assignmentInfo?.assignedToId : undefined,
                  assignedToName: isNowInUse ? assignmentInfo?.assignedToName : undefined,
              };
              return updatedItem;
          }
          return item;
      })
    );


    toast({ title: "Status Updated", description: `"${itemToUpdate.name}" status set to ${newStatus.replace('_', ' ')}.` });
  };

  async function removeItem(itemId: string) {
    const itemToRemove = inventory.find(i => i.id === itemId);
    await deleteInventoryItem(itemId);
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
        case 'maintenance': return 'destructive'; // Will be styled orange via cn
        case 'lost': return 'outline';
    }
  };

  return (
    <>
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
                <CardContent className="space-y-4">
                    <Tabs defaultValue="all" onValueChange={setTypeFilter}>
                        <TabsList>
                            <TabsTrigger value="all">All Types</TabsTrigger>
                            <TabsTrigger value="tool">Tools</TabsTrigger>
                            <TabsTrigger value="material">Materials</TabsTrigger>
                            <TabsTrigger value="consumable">Consumables</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Tabs defaultValue="all" onValueChange={setStatusFilter}>
                        <TabsList>
                            <TabsTrigger value="all">All Statuses</TabsTrigger>
                            <TabsTrigger value="available">Available</TabsTrigger>
                            <TabsTrigger value="in_use">In Use</TabsTrigger>
                            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                            <TabsTrigger value="lost">Lost</TabsTrigger>
                        </TabsList>
                    </Tabs>
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
                            <Badge 
                                variant={getStatusBadgeVariant(item.status)} 
                                className={cn(
                                    item.status === 'available' && 'bg-primary',
                                    item.status === 'maintenance' && 'bg-accent border-accent text-accent-foreground'
                                )}
                            >
                                {item.status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.assignedToName || '---'}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {item.status === 'available' && (
                                        <>
                                            <DropdownMenuItem onSelect={() => handleAssignClick(item)}>Assign</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => updateItemStatus(item.id, 'maintenance')}>Mark for Maintenance</DropdownMenuItem>
                                        </>
                                    )}
                                    {item.status === 'in_use' && <DropdownMenuItem onSelect={() => updateItemStatus(item.id, 'available')}>Check In</DropdownMenuItem>}
                                    {item.status === 'maintenance' && <DropdownMenuItem onSelect={() => updateItemStatus(item.id, 'available')}>Mark as Available</DropdownMenuItem>}
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <DropdownMenuItem onSelect={() => handleEditClick(item)}>Edit Item</DropdownMenuItem>
                                    {item.status !== 'lost' && <DropdownMenuItem onSelect={() => updateItemStatus(item.id, 'lost')}>Mark as Lost</DropdownMenuItem>}
                                    
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive focus:text-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
    <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the item
                    <span className="font-bold"> {itemToDelete?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        if (itemToDelete) {
                            removeItem(itemToDelete.id);
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
