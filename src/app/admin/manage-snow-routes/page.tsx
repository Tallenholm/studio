
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadSnowRoutes, saveSnowRoutes, loadUsers, loadFleetAssets } from '@/lib/localStorageService';
import { getJobs } from '@/lib/firestoreService';
import type { SnowRoute, Job, User, FleetAsset } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Pencil, Route, Truck, Users as UsersIcon, Building2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required.'),
  type: z.enum(['plowing', 'salting', 'sidewalks'], { required_error: 'Route type is required.' }),
  assignedJobIds: z.array(z.string()).optional(),
  assignedVehicleIds: z.array(z.string()).optional(),
  assignedEmployeeIds: z.array(z.string()).optional(),
});

const MultiSelectDropdown = ({ items, field, title, Icon, placeholder }: { items: { id: string, name: string }[], field: any, title: string, Icon: React.ElementType, placeholder: string }) => {
    const selectedItems = items.filter(item => field.value?.includes(item.id));
  
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Icon className="mr-2 h-4 w-4" />
            <span className="truncate">
                {selectedItems.length > 0 ? selectedItems.map(i => i.name).join(', ') : placeholder}
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
                const newValue = checked
                  ? [...(field.value || []), item.id]
                  : field.value?.filter((value: string) => value !== item.id);
                field.onChange(newValue);
              }}
            >
              {item.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  

export default function ManageSnowRoutesPage() {
  const [routes, setRoutes] = useState<SnowRoute[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SnowRoute | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      assignedJobIds: [],
      assignedVehicleIds: [],
      assignedEmployeeIds: [],
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
        setRoutes(loadSnowRoutes());
        const allJobs = await getJobs();
        setJobs(allJobs.filter(j => j.jobType === 'snow_removal'));
        setUsers(loadUsers());
        setFleetAssets(loadFleetAssets().filter(a => a.type === 'truck' || a.type === 'heavyEquipment'));
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveSnowRoutes(routes);
    }
  }, [routes, isMounted]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ name: '', type: undefined, assignedJobIds: [], assignedVehicleIds: [], assignedEmployeeIds: [] });
      setEditingRoute(null);
    }
  };

  const handleEditClick = (route: SnowRoute) => {
    setEditingRoute(route);
    form.reset(route);
    setIsDialogOpen(true);
  };

  function onSubmit(values: z.infer<typeof routeSchema>) {
    if (editingRoute) {
      const updatedRoutes = routes.map(r => (r.id === editingRoute.id ? { ...r, ...values } : r));
      setRoutes(updatedRoutes.sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: 'Route Updated', description: `Route "${values.name}" has been updated.` });
    } else {
      const newRoute: SnowRoute = {
        id: `route-${Date.now()}`,
        ...values,
      };
      setRoutes(prev => [...prev, newRoute].sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: 'Route Added', description: `Route "${values.name}" has been added.` });
    }
    handleDialogOpenChange(false);
  }

  function removeRoute(routeId: string) {
    const routeToRemove = routes.find(r => r.id === routeId);
    setRoutes(prev => prev.filter(r => r.id !== routeId));
    toast({ title: 'Route Removed', description: `Route "${routeToRemove?.name}" has been deleted.`, variant: 'destructive' });
  }

  const renderRouteList = (type: 'plowing' | 'salting' | 'sidewalks', title: string) => {
    const filteredRoutes = routes.filter(r => r.type === type);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map(route => (
              <Card key={route.id} className="bg-muted/30">
                <CardHeader className="flex-row items-center justify-between pb-4">
                  <h3 className="text-lg font-semibold">{route.name}</h3>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(route)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeRoute(route.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <h4 className="font-medium flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary"/>Assigned Crew</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {route.assignedEmployeeIds?.map(id => users.find(u => u.id === id)?.name).map(name => name && <li key={name}>{name}</li>)}
                        </ul>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-medium flex items-center gap-2"><Truck className="h-4 w-4 text-primary"/>Assigned Fleet</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {route.assignedVehicleIds?.map(id => fleetAssets.find(a => a.id === id)?.name).map(name => name && <li key={name}>{name}</li>)}
                        </ul>
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4 text-primary"/>Assigned Contracts</h4>
                         <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {route.assignedJobIds?.map(id => jobs.find(j => j.id === id)?.name).map(name => name && <li key={name}>{name}</li>)}
                        </ul>
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} configured.</div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Routes...</p>
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
                <Route className="h-8 w-8 text-primary" />
                Manage Snow Routes
              </CardTitle>
              <CardDescription className="mt-2">
                Group contracts, personnel, and vehicles into efficient routes for plowing, salting, and sidewalks.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Route
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Snow Route'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route Name</FormLabel>
                          <FormControl><Input placeholder="e.g., North Commercial" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="plowing">Plowing</SelectItem>
                              <SelectItem value="salting">Salting</SelectItem>
                              <SelectItem value="sidewalks">Sidewalks</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Separator />
                    <h4 className="text-md font-medium">Assignments</h4>
                     <FormField
                        control={form.control}
                        name="assignedJobIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assign Contracts</FormLabel>
                                <MultiSelectDropdown items={jobs} field={field} title="Select Contracts" Icon={Building2} placeholder="Select contracts..." />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="assignedEmployeeIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Crew</FormLabel>
                                    <MultiSelectDropdown items={users} field={field} title="Select Crew" Icon={UsersIcon} placeholder="Select crew..." />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="assignedVehicleIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Fleet</FormLabel>
                                    <MultiSelectDropdown items={fleetAssets} field={field} title="Select Fleet" Icon={Truck} placeholder="Select fleet..." />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Route</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderRouteList('plowing', 'Plowing Routes')}
          {renderRouteList('salting', 'Salting Routes')}
          {renderRouteList('sidewalks', 'Sidewalk Routes')}
        </CardContent>
      </Card>
    </div>
  );
}
