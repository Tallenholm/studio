
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadFleetAssets, saveFleetAssets, loadNotifications, saveNotifications } from '@/lib/localStorageService';
import type { FleetAsset, VehicleType, MaintenanceSchedule } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Truck, Box, Shovel, Loader2, Cog, Pencil, Calendar as CalendarIcon, Brain } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isBefore, addDays, addMonths, parseISO } from 'date-fns';
import { getMaintenanceSchedule } from '@/ai/flows/get-maintenance-schedule';
import { Separator } from '@/components/ui/separator';

const maintenanceIntervalSchema = z.object({
    intervalMonths: z.coerce.number().optional(),
    lastServiceDate: z.string().optional(),
});

const assetSchema = z.object({
  type: z.enum(['truck', 'trailer', 'heavyEquipment'], { required_error: 'Asset type is required.' }),
  name: z.string().min(1, 'Asset name is required.'),
  vin: z.string().min(1, 'VIN/Serial is required.').max(17, 'VIN must be 17 characters or less.'),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  registrationDueDate: z.date().optional(),
  insuranceDueDate: z.date().optional(),
  maintenanceSchedule: z.object({
      oilChange: maintenanceIntervalSchema.optional(),
      tireRotation: maintenanceIntervalSchema.optional(),
      brakeInspection: maintenanceIntervalSchema.optional(),
      fluidCheck: maintenanceIntervalSchema.optional(),
  }).optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function FleetManagementPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FleetAsset | null>(null);
  const { toast } = useToast();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      type: 'truck',
      name: '',
      vin: '',
      year: '',
      make: '',
      model: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setAssets(loadFleetAssets());
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveFleetAssets(assets);
    }
  }, [assets, isMounted]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ type: 'truck', name: '', vin: '' });
      setEditingAsset(null);
    }
  };

  const handleEditClick = (asset: FleetAsset) => {
    setEditingAsset(asset);
    form.reset({
      ...asset,
      registrationDueDate: asset.registrationDueDate ? parseISO(asset.registrationDueDate) : undefined,
      insuranceDueDate: asset.insuranceDueDate ? parseISO(asset.insuranceDueDate) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleAiSuggest = async () => {
    const { year, make, model } = form.getValues();
    if (!year || !make || !model) {
        toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide Year, Make, and Model to get AI suggestions.' });
        return;
    }
    setIsAiLoading(true);
    try {
        const schedule = await getMaintenanceSchedule({ year, make, model });
        const currentSchedule = form.getValues('maintenanceSchedule') || {};
        const newSchedule: MaintenanceSchedule = {
            oilChange: schedule.oilChange ? { intervalMonths: schedule.oilChange.intervalMonths, lastServiceDate: currentSchedule.oilChange?.lastServiceDate } : undefined,
            tireRotation: schedule.tireRotation ? { intervalMonths: schedule.tireRotation.intervalMonths, lastServiceDate: currentSchedule.tireRotation?.lastServiceDate } : undefined,
            brakeInspection: schedule.brakeInspection ? { intervalMonths: schedule.brakeInspection.intervalMonths, lastServiceDate: currentSchedule.brakeInspection?.lastServiceDate } : undefined,
            fluidCheck: schedule.fluidCheck ? { intervalMonths: schedule.fluidCheck.intervalMonths, lastServiceDate: currentSchedule.fluidCheck?.lastServiceDate } : undefined,
        };

        form.setValue('maintenanceSchedule', newSchedule);
        toast({ title: 'AI Suggestion Applied', description: 'Maintenance schedule intervals have been updated.' });
    } catch (error) {
        console.error('AI Schedule Suggestion Error:', error);
        toast({ variant: 'destructive', title: 'AI Error', description: 'Could not fetch maintenance suggestions.' });
    } finally {
        setIsAiLoading(false);
    }
  };

  function onSubmit(values: AssetFormValues) {
    const assetData = {
      ...values,
      registrationDueDate: values.registrationDueDate?.toISOString().split('T')[0],
      insuranceDueDate: values.insuranceDueDate?.toISOString().split('T')[0],
    };
    
    let savedAsset: FleetAsset;

    if (editingAsset) {
        savedAsset = { ...editingAsset, ...assetData };
        setAssets((prev) => prev.map(a => a.id === editingAsset.id ? savedAsset : a).sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: 'Asset Updated', description: `${values.name} has been updated.` });
    } else {
        const newId = `asset-${Date.now()}`;
        savedAsset = { id: newId, ...assetData };
        setAssets((prev) => [...prev, savedAsset].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: 'Asset Added', description: `${values.name} has been added to the fleet.` });
    }
    
    // Clean up any resolved notifications
    const notifications = loadNotifications();
    let notificationsChanged = false;

    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    
    // Check registration date
    const regNotifId = `expiry-reg-${savedAsset.id}`;
    if (!savedAsset.registrationDueDate || !isBefore(parseISO(savedAsset.registrationDueDate), thirtyDaysFromNow)) {
      const index = notifications.findIndex(n => n.id === regNotifId);
      if (index > -1) {
        notifications.splice(index, 1);
        notificationsChanged = true;
      }
    }

    // Check insurance date
    const insNotifId = `expiry-ins-${savedAsset.id}`;
     if (!savedAsset.insuranceDueDate || !isBefore(parseISO(savedAsset.insuranceDueDate), thirtyDaysFromNow)) {
      const index = notifications.findIndex(n => n.id === insNotifId);
      if (index > -1) {
        notifications.splice(index, 1);
        notificationsChanged = true;
      }
    }

    if (notificationsChanged) {
      saveNotifications(notifications);
    }

    handleDialogOpenChange(false);
  }

  function removeAsset(assetId: string) {
    const assetToRemove = assets.find(a => a.id === assetId);
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    toast({
      title: 'Asset Removed',
      description: `${assetToRemove?.name} has been removed from the fleet.`,
      variant: 'destructive',
    });
    
    // Also remove related notifications
    const notifications = loadNotifications();
    const updatedNotifications = notifications.filter(n => {
        const parts = n.id.split('-');
        return parts[parts.length - 1] !== assetId;
    });

    if (notifications.length !== updatedNotifications.length) {
      saveNotifications(updatedNotifications);
    }
  }

  const DateCell = ({ dateString }: { dateString?: string }) => {
    if (!dateString) return <TableCell className="text-muted-foreground">N/A</TableCell>;

    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
    const thirtyDaysFromNow = addDays(today, 30);
    let textColor = '';

    if (isBefore(date, today)) {
      textColor = 'text-destructive font-bold'; // Expired
    } else if (isBefore(date, thirtyDaysFromNow)) {
      textColor = 'text-yellow-500 font-semibold'; // Expiring soon
    }

    return (
      <TableCell className={cn(textColor)}>{format(date, 'PPP')}</TableCell>
    );
  };
  
  const renderIcon = (type: VehicleType) => {
    switch (type) {
      case 'truck': return <Truck className="h-5 w-5 text-primary" />;
      case 'trailer': return <Box className="h-5 w-5 text-primary" />;
      case 'heavyEquipment': return <Shovel className="h-5 w-5 text-primary" />;
      default: return null;
    }
  }
  
  const renderAssetsTable = (type: VehicleType, title: string) => {
    const filteredAssets = assets.filter(a => a.type === type);
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">{renderIcon(type)} {title}</CardTitle>
            </CardHeader>
            <CardContent>
                {filteredAssets.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Name/Identifier</TableHead>
                                <TableHead>VIN/Serial</TableHead>
                                <TableHead>Registration Due</TableHead>
                                <TableHead>Insurance Due</TableHead>
                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssets.map(asset => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">{asset.name}</TableCell>
                                    <TableCell>{asset.vin}</TableCell>
                                    <DateCell dateString={asset.registrationDueDate} />
                                    <DateCell dateString={asset.insuranceDueDate} />
                                    <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(asset)} aria-label={`Edit ${asset.name}`}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} aria-label={`Remove ${asset.name}`}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} added yet.</div>
                )}
            </CardContent>
        </Card>
    )
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Fleet Assets...</p>
      </div>
    );
  }

  const MaintenanceScheduleField = ({ name, label }: { name: keyof MaintenanceSchedule, label: string }) => {
    return (
        <div className="grid grid-cols-2 gap-4 items-end">
            <FormField
                control={form.control}
                name={`maintenanceSchedule.${name}.intervalMonths`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label} Interval</FormLabel>
                        <FormControl>
                             <div className="flex items-center">
                                <Input type="number" placeholder="e.g., 6" {...field} />
                                <span className="ml-2 text-sm text-muted-foreground">months</span>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name={`maintenanceSchedule.${name}.lastServiceDate`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Service Date</FormLabel>
                        <FormControl><Input type="text" disabled placeholder="Updated from logs" value={field.value ? format(parseISO(field.value), 'PPP') : 'No record'} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
  }


  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Cog className="h-8 w-8 text-primary" />
                Manage Fleet Assets
              </CardTitle>
              <CardDescription className="mt-2">
                Add, view, and remove the vehicles and equipment in your fleet.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{editingAsset ? 'Edit Fleet Asset' : 'Add New Fleet Asset'}</DialogTitle>
                  <DialogDescription>
                    Add a new truck, trailer, or piece of equipment to your fleet list.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="type" render={({ field }) => ( <FormItem> <FormLabel>Asset Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select an asset type" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="truck">Truck</SelectItem> <SelectItem value="trailer">Trailer</SelectItem> <SelectItem value="heavyEquipment">Heavy Equipment</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name / Identifier</FormLabel> <FormControl><Input placeholder="e.g., Truck 01, Big Tex Trailer" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="vin" render={({ field }) => ( <FormItem> <FormLabel>VIN / Serial Number</FormLabel> <FormControl><Input placeholder="Enter 17-character VIN" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                     </div>
                     <Separator />
                     <h3 className="text-lg font-medium">Document Expiration Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="registrationDueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Registration Due Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="insuranceDueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Insurance Due Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <Separator />
                     <div className="space-y-2">
                        <h3 className="text-lg font-medium">Preventative Maintenance Schedule</h3>
                        <p className="text-sm text-muted-foreground">Set service intervals in months. Last service date is updated automatically from Maintenance Logs.</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="year" render={({ field }) => ( <FormItem> <FormLabel>Year</FormLabel> <FormControl><Input placeholder="e.g., 2022" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="make" render={({ field }) => ( <FormItem> <FormLabel>Make</FormLabel> <FormControl><Input placeholder="e.g., Ford" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="model" render={({ field }) => ( <FormItem> <FormLabel>Model</FormLabel> <FormControl><Input placeholder="e.g., F-550" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                     </div>
                     <Button type="button" variant="outline" onClick={handleAiSuggest} disabled={isAiLoading}>
                        {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Brain className="mr-2 h-4 w-4"/>}
                        {isAiLoading ? "Suggesting..." : "Suggest Schedule with AI"}
                     </Button>
                     <div className="space-y-4 pt-4">
                        <MaintenanceScheduleField name="oilChange" label="Oil Change" />
                        <MaintenanceScheduleField name="tireRotation" label="Tire Rotation" />
                        <MaintenanceScheduleField name="brakeInspection" label="Brake Inspection" />
                        <MaintenanceScheduleField name="fluidCheck" label="Fluid Check" />
                     </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit">Save Asset</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {renderAssetsTable('truck', 'Trucks')}
            {renderAssetsTable('trailer', 'Trailers')}
            {renderAssetsTable('heavyEquipment', 'Heavy Equipment')}
        </CardContent>
      </Card>
    </div>
  );
}
