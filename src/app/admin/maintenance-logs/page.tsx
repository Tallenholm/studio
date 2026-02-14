

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getFleetAssets, getMaintenanceLogs, addMaintenanceLog, deleteMaintenanceLog, updateFleetAsset, getNotifications, deleteNotification } from '@/lib/firestoreService';
import type { FleetAsset, MaintenanceLog, VehicleType, NotificationMessage } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Wrench, Calendar as CalendarIcon, Loader2, Truck, Box, Shovel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const logSchema = z.object({
  assetId: z.string({ required_error: 'Please select an asset.' }),
  date: z.date({ required_error: 'A date is required.' }),
  serviceType: z.enum(['routine', 'repair', 'inspection', 'other'], { required_error: 'Service type is required.' }),
  routineService: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  cost: z.coerce.number().optional(),
  mechanic: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.serviceType === 'routine' && !data.routineService) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify the routine service performed.",
            path: ["routineService"],
        });
    }
});

export default function MaintenanceLogsPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [logToDelete, setLogToDelete] = useState<MaintenanceLog | null>(null);

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      serviceType: 'routine',
      description: '',
      mechanic: 'In-house',
    },
  });

  const watchedServiceType = form.watch('serviceType');

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [assetsData, logsData] = await Promise.all([
                getFleetAssets(),
                getMaintenanceLogs(),
            ]);
            setAssets(assetsData);
            setLogs(logsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load maintenance data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof logSchema>) {
    const asset = assets.find(a => a.id === values.assetId);
    if (!asset) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected asset not found.' });
        return;
    }

    const newLogData: Omit<MaintenanceLog, 'id'> = {
      assetId: asset.id,
      assetName: asset.name,
      date: values.date.toISOString().split('T')[0],
      cost: values.cost,
      mechanic: values.mechanic,
      routineService: values.routineService,
      serviceType: values.serviceType,
      description: values.description,
    };
    
    const newLogId = await addMaintenanceLog(newLogData);
    const newLog = {id: newLogId, ...newLogData};
    setLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    let scheduleWasUpdated = false;
    // Update asset's last service date if it was a routine service
    if (newLog.serviceType === 'routine' && newLog.routineService) {
        const key = newLog.routineService as keyof FleetAsset['maintenanceSchedule'];
        if (asset.maintenanceSchedule?.[key]) {
            scheduleWasUpdated = true;
            const updatedSchedule = { ...asset.maintenanceSchedule };
            updatedSchedule[key]!.lastServiceDate = newLog.date;

            await updateFleetAsset(asset.id, { maintenanceSchedule: updatedSchedule });
            
            setAssets(assets.map(a => a.id === asset.id ? { ...a, maintenanceSchedule: updatedSchedule } : a));

             // Remove the corresponding maintenance notification
            const notifId = `maint-${key}-${asset.id}`;
            const notifications = await getNotifications();
            if (notifications.some(n => n.id === notifId)) {
                await deleteNotification(notifId);
            }
        }
    }
    
    toast({ 
        title: 'Maintenance Logged', 
        description: `Service for ${asset.name} has been recorded.${scheduleWasUpdated ? ' The maintenance schedule has also been updated.' : ''}`
    });
    
    setIsDialogOpen(false);
    form.reset({ serviceType: 'routine', description: '', mechanic: 'In-house', cost: undefined, assetId: undefined });
  }

  async function removeLog(logId: string) {
    const logToRemove = logs.find(v => v.id === logId);
    await deleteMaintenanceLog(logId);
    setLogs(prev => prev.filter(v => v.id !== logId));
    toast({
      title: 'Log Removed',
      description: `The maintenance log for ${logToRemove?.assetName} has been deleted.`,
      variant: 'destructive',
    });
  }

  const getServiceTypeLabel = (log: MaintenanceLog) => {
    const baseType = log.serviceType.charAt(0).toUpperCase() + log.serviceType.slice(1);
    if (log.serviceType === 'routine' && log.routineService) {
      const routineLabel = log.routineService.replace(/([A-Z])/g, ' $1').trim();
      return `${baseType}: ${routineLabel.charAt(0).toUpperCase() + routineLabel.slice(1)}`;
    }
    return baseType;
  }

  const renderLogsTable = (type: VehicleType, title: string) => {
    const filteredLogs = logs.filter(log => {
      const asset = assets.find(a => a.id === log.assetId);
      return asset?.type === type;
    });

    const getIcon = () => {
      switch (type) {
        case 'truck': return <Truck className="h-6 w-6 text-primary" />;
        case 'trailer': return <Box className="h-6 w-6 text-primary" />;
        case 'heavyEquipment': return <Shovel className="h-6 w-6 text-primary" />;
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{getIcon()} {title}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.assetName}</TableCell>
                      <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                      <TableCell>{getServiceTypeLabel(log)}</TableCell>
                      <TableCell className="max-w-sm">{log.description}</TableCell>
                      <TableCell>{log.cost ? `$${log.cost.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{log.mechanic || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setLogToDelete(log)} aria-label={`Remove log for ${log.assetName}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                <h3 className="text-xl font-semibold text-foreground">No Maintenance Logs Found</h3>
                <p className="mt-2">No maintenance has been logged for {title.toLowerCase()} yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Maintenance Records...</p>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Wrench className="h-8 w-8 text-primary" />
                Fleet Maintenance Logs
              </CardTitle>
              <CardDescription className="mt-2">
                Log, view, and manage service history for all fleet assets.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Log New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log New Maintenance</DialogTitle>
                  <DialogDescription>
                    Fill out the details for the service performed. This record is for internal use.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="assetId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Asset</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an asset" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {assets.map(asset => (
                                      <SelectItem key={asset.id} value={asset.id}>
                                          {asset.name}
                                      </SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                              <FormItem className="flex flex-col">
                              <FormLabel>Date of Service</FormLabel>
                              <Popover>
                                  <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button
                                      variant={"outline"}
                                      className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                      )}
                                      >
                                      {field.value ? (
                                          format(field.value, "PPP")
                                      ) : (
                                          <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                  </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                  />
                                  </PopoverContent>
                              </Popover>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a service type" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="routine">Routine Service</SelectItem>
                                  <SelectItem value="repair">Repair</SelectItem>
                                  <SelectItem value="inspection">Inspection</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    {watchedServiceType === 'routine' && (
                        <FormField
                            control={form.control}
                            name="routineService"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Routine Service Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a routine service" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="oilChange">Oil Change</SelectItem>
                                        <SelectItem value="tireRotation">Tire Rotation</SelectItem>
                                        <SelectItem value="brakeInspection">Brake Inspection</SelectItem>
                                        <SelectItem value="fluidCheck">Fluid Check</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Service</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Provide a detailed description of the work performed." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cost (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 150.50" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
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
                     </div>
                    <DialogFooter>
                      <Button type="submit">Save Log</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {renderLogsTable('truck', 'Trucks')}
            {renderLogsTable('trailer', 'Trailers')}
            {renderLogsTable('heavyEquipment', 'Heavy Equipment')}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the maintenance log for
                    <span className="font-bold"> {logToDelete?.assetName}</span> on <span className="font-bold">{logToDelete?.date ? format(parseISO(logToDelete.date), 'PPP') : ''}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        if (logToDelete) {
                            removeLog(logToDelete.id);
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
