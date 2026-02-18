
'use client';

import { useState, useMemo } from 'react';
import type { FleetAsset, MaintenanceSchedule, NotificationMessage } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addFleetAsset, updateFleetAsset, deleteFleetAsset } from '@/lib/firestoreService';
import { suggestMaintenanceSchedule } from '@/ai/flows/suggest-maintenance-schedule';
import type { SuggestMaintenanceScheduleOutput } from '@/ai/flows/suggest-maintenance-schedule';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Pencil, Truck, Box, Shovel, MoreHorizontal, Brain, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/common/EmptyState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const scheduleItemSchema = z.object({
  intervalMonths: z.coerce.number().int().min(1),
  lastServiceDate: z.date().optional(),
});

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required.'),
  type: z.enum(['truck', 'trailer', 'heavyEquipment']),
  vin: z.string().min(1, 'VIN or identifier is required.'),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  registrationDueDate: z.date().optional(),
  insuranceDueDate: z.date().optional(),
  maintenanceSchedule: z.object({
    oilChange: scheduleItemSchema.optional(),
    tireRotation: scheduleItemSchema.optional(),
    brakeInspection: scheduleItemSchema.optional(),
    fluidCheck: scheduleItemSchema.optional(),
  }).optional(),
});

interface FleetManagementClientPageProps {
  initialAssets: FleetAsset[];
  initialNotifications: NotificationMessage[];
}

const DatePicker = ({ field, placeholder }: { field: any, placeholder: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <FormControl>
        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
          {field.value ? format(field.value, "PPP") : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </FormControl>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() - 50} toYear={new Date().getFullYear() + 5} />
    </PopoverContent>
  </Popover>
);

export default function FleetManagementClientPage({ initialAssets, initialNotifications }: FleetManagementClientPageProps) {
  const [assets, setAssets] = useState<FleetAsset[]>(initialAssets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FleetAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<FleetAsset | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: { type: 'truck' },
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingAsset(null);
      form.reset({ name: '', type: 'truck', vin: '', year: '', make: '', model: '' });
    }
  };

  const handleEditClick = (asset: FleetAsset) => {
    setEditingAsset(asset);
    form.reset({
      ...asset,
      registrationDueDate: asset.registrationDueDate ? parseISO(asset.registrationDueDate) : undefined,
      insuranceDueDate: asset.insuranceDueDate ? parseISO(asset.insuranceDueDate) : undefined,
      maintenanceSchedule: {
        oilChange: asset.maintenanceSchedule?.oilChange ? { ...asset.maintenanceSchedule.oilChange, lastServiceDate: asset.maintenanceSchedule.oilChange.lastServiceDate ? parseISO(asset.maintenanceSchedule.oilChange.lastServiceDate) : undefined } : undefined,
        tireRotation: asset.maintenanceSchedule?.tireRotation ? { ...asset.maintenanceSchedule.tireRotation, lastServiceDate: asset.maintenanceSchedule.tireRotation.lastServiceDate ? parseISO(asset.maintenanceSchedule.tireRotation.lastServiceDate) : undefined } : undefined,
        brakeInspection: asset.maintenanceSchedule?.brakeInspection ? { ...asset.maintenanceSchedule.brakeInspection, lastServiceDate: asset.maintenanceSchedule.brakeInspection.lastServiceDate ? parseISO(asset.maintenanceSchedule.brakeInspection.lastServiceDate) : undefined } : undefined,
        fluidCheck: asset.maintenanceSchedule?.fluidCheck ? { ...asset.maintenanceSchedule.fluidCheck, lastServiceDate: asset.maintenanceSchedule.fluidCheck.lastServiceDate ? parseISO(asset.maintenanceSchedule.fluidCheck.lastServiceDate) : undefined } : undefined,
      }
    });
    setIsDialogOpen(true);
  };
  
  const handleSuggestSchedule = async () => {
    const { year, make, model } = form.getValues();
    if (!year || !make || !model) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please provide Year, Make, and Model to suggest a schedule.' });
      return;
    }
    setIsSuggesting(true);
    try {
      const schedule = await suggestMaintenanceSchedule({ year, make, model });
      const currentSchedule = form.getValues('maintenanceSchedule') || {};
      const newSchedule = {
        oilChange: schedule.oilChange ? { ...currentSchedule.oilChange, intervalMonths: schedule.oilChange.intervalMonths } : currentSchedule.oilChange,
        tireRotation: schedule.tireRotation ? { ...currentSchedule.tireRotation, intervalMonths: schedule.tireRotation.intervalMonths } : currentSchedule.tireRotation,
        brakeInspection: schedule.brakeInspection ? { ...currentSchedule.brakeInspection, intervalMonths: schedule.brakeInspection.intervalMonths } : currentSchedule.brakeInspection,
        fluidCheck: schedule.fluidCheck ? { ...currentSchedule.fluidCheck, intervalMonths: schedule.fluidCheck.intervalMonths } : currentSchedule.fluidCheck,
      };
      form.setValue('maintenanceSchedule', newSchedule);
      toast({ title: 'AI Suggestion Complete', description: 'Maintenance intervals have been populated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate a maintenance schedule.' });
    } finally {
      setIsSuggesting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof assetSchema>) {
    const assetData = {
      ...values,
      registrationDueDate: values.registrationDueDate ? format(values.registrationDueDate, 'yyyy-MM-dd') : undefined,
      insuranceDueDate: values.insuranceDueDate ? format(values.insuranceDueDate, 'yyyy-MM-dd') : undefined,
      maintenanceSchedule: {
        oilChange: values.maintenanceSchedule?.oilChange ? { ...values.maintenanceSchedule.oilChange, lastServiceDate: values.maintenanceSchedule.oilChange.lastServiceDate ? format(values.maintenanceSchedule.oilChange.lastServiceDate, 'yyyy-MM-dd') : undefined } : undefined,
        tireRotation: values.maintenanceSchedule?.tireRotation ? { ...values.maintenanceSchedule.tireRotation, lastServiceDate: values.maintenanceSchedule.tireRotation.lastServiceDate ? format(values.maintenanceSchedule.tireRotation.lastServiceDate, 'yyyy-MM-dd') : undefined } : undefined,
        brakeInspection: values.maintenanceSchedule?.brakeInspection ? { ...values.maintenanceSchedule.brakeInspection, lastServiceDate: values.maintenanceSchedule.brakeInspection.lastServiceDate ? format(values.maintenanceSchedule.brakeInspection.lastServiceDate, 'yyyy-MM-dd') : undefined } : undefined,
        fluidCheck: values.maintenanceSchedule?.fluidCheck ? { ...values.maintenanceSchedule.fluidCheck, lastServiceDate: values.maintenanceSchedule.fluidCheck.lastServiceDate ? format(values.maintenanceSchedule.fluidCheck.lastServiceDate, 'yyyy-MM-dd') : undefined } : undefined,
      }
    };

    if (editingAsset) {
      await updateFleetAsset(editingAsset.id, assetData);
      setAssets(prev => prev.map(a => (a.id === editingAsset.id ? { id: a.id, ...assetData } as FleetAsset : a)));
      toast({ title: 'Asset Updated', description: `Asset "${values.name}" has been updated.` });
    } else {
      const newId = await addFleetAsset(assetData);
      setAssets(prev => [...prev, { id: newId, ...assetData } as FleetAsset]);
      toast({ title: 'Asset Added', description: `Asset "${values.name}" has been added.` });
    }
    handleDialogOpenChange(false);
  }
  
  async function removeAsset(assetId: string) {
    const assetToRemove = assets.find(a => a.id === assetId);
    await deleteFleetAsset(assetId);
    setAssets(prev => prev.filter(a => a.id !== assetId));
    toast({ title: 'Asset Removed', description: `Asset "${assetToRemove?.name}" has been removed.`, variant: 'destructive' });
  }

  const getAssetIcon = (type: FleetAsset['type']) => {
    if (type === 'truck') return <Truck />;
    if (type === 'trailer') return <Box />;
    if (type === 'heavyEquipment') return <Shovel />;
  };

  const renderScheduleField = (name: keyof MaintenanceSchedule, label: string) => (
    <div className="grid grid-cols-2 gap-4 items-end">
        <FormField control={form.control} name={`maintenanceSchedule.${name}.intervalMonths`} render={({ field }) => (
            <FormItem><FormLabel>{label} Interval (Months)</FormLabel><FormControl><Input type="number" placeholder="e.g., 6" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`maintenanceSchedule.${name}.lastServiceDate`} render={({ field }) => (
            <FormItem><FormLabel>Last Service Date</FormLabel><DatePicker field={field} placeholder="Pick a date" /></FormItem>
        )} />
    </div>
  );

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Fleet" description="Add, view, and edit all company vehicles and heavy equipment." icon={Truck}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-5 w-5" />Add New Asset</Button></DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader><DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input placeholder="e.g., Truck 01, CAT 259D" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="truck">Truck</SelectItem><SelectItem value="trailer">Trailer</SelectItem><SelectItem value="heavyEquipment">Heavy Equipment</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="vin" render={({ field }) => (<FormItem><FormLabel>VIN / Identifier</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="registrationDueDate" render={({ field }) => (<FormItem><FormLabel>Registration Due</FormLabel><DatePicker field={field} placeholder="Registration due" /></FormItem>)} />
                    <FormField control={form.control} name="insuranceDueDate" render={({ field }) => (<FormItem><FormLabel>Insurance Due</FormLabel><DatePicker field={field} placeholder="Insurance due" /></FormItem>)} />
                  </div>
                  <Card><CardHeader>
                      <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Preventative Maintenance</CardTitle>
                          <Button type="button" variant="outline" size="sm" onClick={handleSuggestSchedule} disabled={isSuggesting}>{isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Brain className="mr-2 h-4 w-4"/>}Suggest</Button>
                      </div>
                      <CardDescription>Set service intervals and last service dates.</CardDescription>
                  </CardHeader><CardContent className="space-y-4">
                      {renderScheduleField('oilChange', 'Oil Change')}
                      {renderScheduleField('tireRotation', 'Tire Rotation')}
                      {renderScheduleField('brakeInspection', 'Brake Inspection')}
                      {renderScheduleField('fluidCheck', 'Fluid Check')}
                  </CardContent></Card>
                  <DialogFooter><Button type="submit">Save Asset</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>
        
        <div className="mt-8 animate-fade-in-up">
            {assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map(asset => (
                        <Card key={asset.id}>
                            <CardHeader><div className="flex justify-between items-start"><CardTitle className="flex items-center gap-2 text-xl">{getAssetIcon(asset.type)}{asset.name}</CardTitle><Badge variant={asset.type === 'truck' ? 'default' : 'secondary'} className="capitalize">{asset.type.replace('heavyEquipment', 'Equipment')}</Badge></div></CardHeader>
                            <CardContent className="text-sm text-muted-foreground"><p><strong>VIN:</strong> {asset.vin}</p><p><strong>Model:</strong> {asset.year} {asset.make} {asset.model}</p></CardContent>
                            <CardFooter className="flex justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleEditClick(asset)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setAssetToDelete(asset)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Truck} title="No Fleet Assets Found" message="Click 'Add New Asset' to get started." onAction={() => setIsDialogOpen(true)} actionLabel="Add New Asset" />
            )}
        </div>

      </div>
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the asset "{assetToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(assetToDelete) removeAsset(assetToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
