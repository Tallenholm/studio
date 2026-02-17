'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addSnowRoute, updateSnowRoute, deleteSnowRoute } from '@/lib/firestoreService';
import type { SnowRoute, Job, User, FleetAsset } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
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
import { PlusCircle, Trash2, Pencil, MoreHorizontal, Loader2, Route, Truck, Users, Shovel } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

const snowRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required.'),
  type: z.enum(['plowing', 'salting', 'sidewalks'], { required_error: 'Route type is required.' }),
  assignedJobIds: z.array(z.string()).optional(),
  assignedVehicleIds: z.array(z.string()).optional(),
  assignedEmployeeIds: z.array(z.string()).optional(),
});


interface ManageSnowRoutesClientPageProps {
    initialRoutes: SnowRoute[];
    initialSnowJobs: Job[];
    initialUsers: User[];
    initialFleetAssets: FleetAsset[];
}

const MultiSelectDropdown = ({ items, fieldName, title, Icon, form }: { items: { id: string, name: string }[], fieldName: any, title: string, Icon: React.ElementType, form: UseFormReturn<any> }) => {
    const selectedIds = form.watch(fieldName) || [];
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
  
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</FormLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <span className="truncate">
                      {selectedItems.length > 0 ? selectedItems.map(i => i.name).join(', ') : `Select...`}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.map(item => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={field.value?.includes(item.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...(field.value || []), item.id])
                        : field.onChange(field.value?.filter((value: string) => value !== item.id))
                    }}
                  >
                    {item.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <FormMessage />
          </FormItem>
        )}
      />
    )
}

export default function ManageSnowRoutesClientPage({ initialRoutes, initialSnowJobs, initialUsers, initialFleetAssets }: ManageSnowRoutesClientPageProps) {
  const [routes, setRoutes] = useState<SnowRoute[]>(initialRoutes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SnowRoute | null>(null);
  const { toast } = useToast();
  const [routeToDelete, setRouteToDelete] = useState<SnowRoute | null>(null);

  const form = useForm<z.infer<typeof snowRouteSchema>>({
    resolver: zodResolver(snowRouteSchema),
    defaultValues: {
        name: '',
        type: 'plowing',
        assignedJobIds: [],
        assignedVehicleIds: [],
        assignedEmployeeIds: [],
    },
  });

  const { trucks, heavyEquipments } = useMemo(() => ({
    trucks: initialFleetAssets.filter(a => a.type === 'truck'),
    heavyEquipments: initialFleetAssets.filter(a => a.type === 'heavyEquipment'),
  }), [initialFleetAssets]);

  const employeeUsers = useMemo(() => initialUsers.filter(u => u.role === 'employee'), [initialUsers]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setEditingRoute(null);
    }
  };

  const handleEditClick = (route: SnowRoute) => {
    setEditingRoute(route);
    form.reset({
        ...route,
        assignedJobIds: route.assignedJobIds || [],
        assignedVehicleIds: route.assignedVehicleIds || [],
        assignedEmployeeIds: route.assignedEmployeeIds || [],
    });
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof snowRouteSchema>) {
    if (editingRoute) {
      await updateSnowRoute(editingRoute.id, values);
      setRoutes(prevRoutes =>
        prevRoutes.map(r =>
          r.id === editingRoute.id ? { ...r, ...values } : r
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({ title: 'Route Updated', description: `Route "${values.name}" has been updated.` });
    } else {
      const newRouteId = await addSnowRoute(values);
      const newRoute = { id: newRouteId, ...values };
      setRoutes(prev => [...prev, newRoute].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Route Added', description: `Route "${values.name}" has been added.` });
    }
    handleDialogOpenChange(false);
  }

  async function removeRoute(routeId: string) {
    const routeToRemove = routes.find(r => r.id === routeId);
    await deleteSnowRoute(routeId);
    setRoutes((prev) => prev.filter((route) => route.id !== routeId));
    toast({
      title: 'Route Removed',
      description: `Route "${routeToRemove?.name}" has been removed.`,
      variant: 'destructive',
    });
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader
          title="Manage Snow Routes"
          description="Create and organize snow removal routes by grouping jobs, vehicles, and crew."
          icon={Route}
        >
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Route
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingRoute ? 'Edit Snow Route' : 'Add New Snow Route'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem> <FormLabel>Route Name</FormLabel> <FormControl><Input placeholder="e.g., North Commercial Plow Route" {...field} /></FormControl> <FormMessage /> </FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem> <FormLabel>Route Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="plowing">Plowing</SelectItem> <SelectItem value="salting">Salting</SelectItem> <SelectItem value="sidewalks">Sidewalks</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>
                    )} />
                  
                    <MultiSelectDropdown items={initialSnowJobs} fieldName="assignedJobIds" title="Assign Contracts" Icon={Pencil} form={form} />
                    <MultiSelectDropdown items={trucks} fieldName="assignedVehicleIds" title="Assign Vehicles" Icon={Truck} form={form} />
                    <MultiSelectDropdown items={employeeUsers} fieldName="assignedEmployeeIds" title="Assign Employees" Icon={Users} form={form} />
                  
                    <DialogFooter>
                        <Button type="submit">Save Route</Button>
                    </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="mt-8 animate-fade-in-up space-y-4">
          {routes.length > 0 ? (
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned Jobs</TableHead>
                    <TableHead>Assigned Crew</TableHead>
                    <TableHead>Assigned Vehicles</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map(route => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell className="capitalize">{route.type}</TableCell>
                      <TableCell>{route.assignedJobIds?.length || 0}</TableCell>
                      <TableCell>{route.assignedEmployeeIds?.length || 0}</TableCell>
                      <TableCell>{route.assignedVehicleIds?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(route)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setRouteToDelete(route)} className="text-destructive">
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
              icon={Route}
              title="No Snow Routes Found"
              message='Click "Add New Route" to get started.'
              actionLabel={"Add New Route"}
              onAction={() => setIsDialogOpen(true)}
            />
          )}
        </div>
      </div>
      <AlertDialog open={!!routeToDelete} onOpenChange={(open) => !open && setRouteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route
              <span className="font-bold"> {routeToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (routeToDelete) {
                  removeRoute(routeToDelete.id);
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
