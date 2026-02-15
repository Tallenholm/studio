
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FleetAsset, VehicleType, ManagedDocument, MaintenanceSchedule, NotificationMessage } from '@/lib/types';
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
import { PlusCircle, Trash2, Truck, Box, Shovel, Loader2, Cog, Pencil, Calendar as CalendarIcon, MoreHorizontal, FileUp, CheckCircle, Link as LinkIcon, Brain } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isBefore, addDays, parseISO, getYear, addMonths } from 'date-fns';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addFleetAsset, getFleetAssets, updateFleetAsset, deleteFleetAsset, getNotifications, deleteNotification, addNotification, addDocument, uploadFile } from '@/lib/firestoreService';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { suggestMaintenanceSchedule } from '@/ai/flows/suggest-maintenance-schedule';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import EmptyState from '@/components/common/EmptyState';

const maintenanceScheduleItemSchema = z.object({
  intervalMonths: z.coerce.number().positive().optional(),
  lastServiceDate: z.date().optional().nullable(),
});

const assetSchema = z.object({
  type: z.enum(['truck', 'trailer', 'heavyEquipment'], { required_error: 'Asset type is required.' }),
  name: z.string().min(1, 'Asset name is required.'),
  vin: z.string().min(1, 'VIN/Serial is required.'),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  registrationDueDate: z.date().optional().nullable(),
  insuranceDueDate: z.date().optional().nullable(),
  registrationDocument: z.custom<File>().optional(),
  insuranceDocument: z.custom<File>().optional(),
  documentIds: z.array(z.string()).optional(),
  maintenanceSchedule: z.object({
    oilChange: maintenanceScheduleItemSchema.optional(),
    tireRotation: maintenanceScheduleItemSchema.optional(),
    brakeInspection: maintenanceScheduleItemSchema.optional(),
    fluidCheck: maintenanceScheduleItemSchema.optional(),
  }).optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

const ScheduleItemField = ({ form, name, label }: { form: UseFormReturn<AssetFormValues>, name: `maintenanceSchedule.${'oilChange' | 'tireRotation' | 'brakeInspection' | 'fluidCheck'}`, label: string }) => {
  return (
    <div className="flex items-end gap-2 p-2 border rounded-md bg-muted/30">
      <div className="flex-1">
        <FormField
          control={form.control}
          name={`${name}.intervalMonths`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} Interval</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Months" {...field} value={field.value || ''} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="flex-1">
        <FormField
          control={form.control}
          name={`${name}.lastServiceDate`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Last Service</FormLabel>
              <Popover>
                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Pick date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default function FleetManagementPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FleetAsset | null>(null);
  const { toast } = useToast();
  const { user: adminUser } = useUser();
  const [assetToDelete, setAssetToDelete] = useState<FleetAsset | null>(null);

  const [isUploadingReg, setIsUploadingReg] = useState(false);
  const [isUploadingIns, setIsUploadingIns] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const regFileInputRef = useRef<HTMLInputElement>(null);
  const insFileInputRef = useRef<HTMLInputElement>(null);

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
    async function fetchData() {
      setIsLoading(true);
      try {
        const [assetsData, notifications] = await Promise.all([
          getFleetAssets(),
          getNotifications()
        ]);
        setAssets(assetsData);
        checkAndCreateExpiryNotifications(assetsData, notifications);
      } catch (error) {
        console.error("Failed to fetch fleet assets:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load fleet assets.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const checkAndCreateExpiryNotifications = async (assetsToCheck: FleetAsset[], existingNotifications: NotificationMessage[]) => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    const notificationPromises: Promise<any>[] = [];

    for (const asset of assetsToCheck) {
      if (asset.registrationDueDate) {
        const dueDate = parseISO(asset.registrationDueDate);
        if (isBefore(dueDate, thirtyDaysFromNow)) {
          const notifId = `expiry-reg-${asset.id}`;
          if (!existingNotifications.some(n => n.id === notifId)) {
            notificationPromises.push(addNotification({ recipientId: 'all', title: 'Registration Expiring Soon', content: `The registration for ${asset.name} is due on ${format(dueDate, 'PPP')}.`, senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [] }, notifId));
          }
        }
      }
      if (asset.insuranceDueDate) {
        const dueDate = parseISO(asset.insuranceDueDate);
        if (isBefore(dueDate, thirtyDaysFromNow)) {
          const notifId = `expiry-ins-${asset.id}`;
          if (!existingNotifications.some(n => n.id === notifId)) {
            notificationPromises.push(addNotification({ recipientId: 'all', title: 'Insurance Expiring Soon', content: `The insurance for ${asset.name} is due on ${format(dueDate, 'PPP')}.`, senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [] }, notifId));
          }
        }
      }
      if (asset.maintenanceSchedule) {
        for (const key of Object.keys(asset.maintenanceSchedule) as (keyof MaintenanceSchedule)[]) {
          const item = asset.maintenanceSchedule[key];
          if (item?.intervalMonths && item.lastServiceDate) {
            const lastService = parseISO(item.lastServiceDate);
            const dueDate = addMonths(lastService, item.intervalMonths);
            if (isBefore(dueDate, thirtyDaysFromNow)) {
              const notifId = `maint-${key}-${asset.id}`;
              if (!existingNotifications.some(n => n.id === notifId)) {
                const serviceName = key.replace(/([A-Z])/g, ' $1').trim();
                notificationPromises.push(addNotification({ recipientId: 'all', title: 'Maintenance Due Soon', content: `A routine ${serviceName.toLowerCase()} is due for ${asset.name} on ${format(dueDate, 'PPP')}.`, senderName: 'System Alert', timestamp: new Date().toISOString(), readBy: [] }, notifId));
              }
            }
          }
        }
      }
    }
    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
      toast({ title: 'Renewal Reminders Sent', description: `Notifications for ${notificationPromises.length} upcoming renewals have been sent.` });
    }
  };

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
      registrationDueDate: asset.registrationDueDate ? parseISO(asset.registrationDueDate) : null,
      insuranceDueDate: asset.insuranceDueDate ? parseISO(asset.insuranceDueDate) : null,
      maintenanceSchedule: {
        oilChange: asset.maintenanceSchedule?.oilChange ? { ...asset.maintenanceSchedule.oilChange, lastServiceDate: asset.maintenanceSchedule.oilChange.lastServiceDate ? parseISO(asset.maintenanceSchedule.oilChange.lastServiceDate) : null } : {},
        tireRotation: asset.maintenanceSchedule?.tireRotation ? { ...asset.maintenanceSchedule.tireRotation, lastServiceDate: asset.maintenanceSchedule.tireRotation.lastServiceDate ? parseISO(asset.maintenanceSchedule.tireRotation.lastServiceDate) : null } : {},
        brakeInspection: asset.maintenanceSchedule?.brakeInspection ? { ...asset.maintenanceSchedule.brakeInspection, lastServiceDate: asset.maintenanceSchedule.brakeInspection.lastServiceDate ? parseISO(asset.maintenanceSchedule.brakeInspection.lastServiceDate) : null } : {},
        fluidCheck: asset.maintenanceSchedule?.fluidCheck ? { ...asset.maintenanceSchedule.fluidCheck, lastServiceDate: asset.maintenanceSchedule.fluidCheck.lastServiceDate ? parseISO(asset.maintenanceSchedule.fluidCheck.lastServiceDate) : null } : {},
      }
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'registration' | 'insurance') => {
    const file = event.target.files?.[0];
    if (!file || !adminUser) return;

    const setLoading = fileType === 'registration' ? setIsUploadingReg : setIsUploadingIns;
    setLoading(true);

    try {
      if (fileType === 'registration') {
        form.setValue('registrationDocument', file);
      } else {
        form.setValue('insuranceDocument', file);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "File Error", description: "Could not handle file." });
    } finally {
      setLoading(false);
    }
  }

  const handleSuggestSchedule = async () => {
    const { year, make, model } = form.getValues();
    if (!year || !make || !model) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide Year, Make, and Model to suggest a schedule.',
      });
      return;
    }
    setIsSuggesting(true);
    try {
      const schedule = await suggestMaintenanceSchedule({ year, make, model });

      if (schedule.oilChange) form.setValue('maintenanceSchedule.oilChange.intervalMonths', schedule.oilChange.intervalMonths);
      if (schedule.tireRotation) form.setValue('maintenanceSchedule.tireRotation.intervalMonths', schedule.tireRotation.intervalMonths);
      if (schedule.brakeInspection) form.setValue('maintenanceSchedule.brakeInspection.intervalMonths', schedule.brakeInspection.intervalMonths);
      if (schedule.fluidCheck) form.setValue('maintenanceSchedule.fluidCheck.intervalMonths', schedule.fluidCheck.intervalMonths);

      toast({ title: 'AI Suggestion Applied', description: 'A standard maintenance schedule has been pre-filled.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not suggest a schedule.' });
    } finally {
      setIsSuggesting(false);
    }
  };


  async function onSubmit(values: AssetFormValues) {
    let savedAsset: FleetAsset;

    const assetData: Partial<Omit<FleetAsset, 'id'>> = {
      type: values.type, name: values.name, vin: values.vin, year: values.year, make: values.make, model: values.model,
    };

    if (values.registrationDueDate) assetData.registrationDueDate = values.registrationDueDate.toISOString().split('T')[0];
    if (values.insuranceDueDate) assetData.insuranceDueDate = values.insuranceDueDate.toISOString().split('T')[0];
    if (values.maintenanceSchedule) {
      assetData.maintenanceSchedule = {
        oilChange: values.maintenanceSchedule.oilChange?.intervalMonths ? { ...values.maintenanceSchedule.oilChange, lastServiceDate: values.maintenanceSchedule.oilChange.lastServiceDate?.toISOString().split('T')[0] } : undefined,
        tireRotation: values.maintenanceSchedule.tireRotation?.intervalMonths ? { ...values.maintenanceSchedule.tireRotation, lastServiceDate: values.maintenanceSchedule.tireRotation.lastServiceDate?.toISOString().split('T')[0] } : undefined,
        brakeInspection: values.maintenanceSchedule.brakeInspection?.intervalMonths ? { ...values.maintenanceSchedule.brakeInspection, lastServiceDate: values.maintenanceSchedule.brakeInspection.lastServiceDate?.toISOString().split('T')[0] } : undefined,
        fluidCheck: values.maintenanceSchedule.fluidCheck?.intervalMonths ? { ...values.maintenanceSchedule.fluidCheck, lastServiceDate: values.maintenanceSchedule.fluidCheck.lastServiceDate?.toISOString().split('T')[0] } : undefined,
      }
    }

    if (editingAsset) {
      await updateFleetAsset(editingAsset.id, assetData);
      savedAsset = { ...editingAsset, ...assetData } as FleetAsset;
      setAssets((prev) => prev.map(a => a.id === editingAsset.id ? savedAsset : a).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      toast({ title: 'Asset Updated', description: `${values.name} has been updated.` });
    } else {
      const newId = await addFleetAsset(assetData as Omit<FleetAsset, 'id'>);
      savedAsset = { id: newId, ...assetData } as FleetAsset;
      setAssets((prev) => [...prev, savedAsset].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      toast({ title: 'Asset Added', description: `${values.name} has been added to the fleet.` });
    }

    const processDocument = async (file: File | undefined, docType: ManagedDocument['documentType'], asset: FleetAsset) => {
      if (file && adminUser) {
        const path = `documents/${asset.id}/${Date.now()}-${file.name}`;
        const downloadUrl = await uploadFile(file, path);
        const dataUri = await new Promise<string>(resolve => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => resolve(reader.result as string) });
        const summary = await summarizeDocument({ documentDataUri: dataUri });
        const newDoc: Omit<ManagedDocument, 'id'> = { title: summary.title || `${asset.name} ${docType}`, description: summary.description || `Document for ${asset.name}`, category: asset.name, documentType: docType, documentUrl: downloadUrl, assetId: asset.id };
        return addDocument(newDoc);
      }
    };

    const docProcessingPromises = [
      processDocument(values.registrationDocument, 'registration', savedAsset),
      processDocument(values.insuranceDocument, 'insurance', savedAsset)
    ];

    const newDocIds = (await Promise.all(docProcessingPromises)).filter((id): id is string => !!id);

    if (newDocIds.length > 0) {
      const updatedIds = [...(savedAsset.documentIds || []), ...newDocIds];
      await updateFleetAsset(savedAsset.id, { documentIds: updatedIds });
      setAssets(assets.map(a => a.id === savedAsset.id ? { ...a, documentIds: updatedIds } : a));
    }

    const notifications = await getNotifications();
    const notificationPromises: Promise<void>[] = [];
    const thirtyDaysFromNow = addDays(new Date(), 30);

    const regNotifId = `expiry-reg-${savedAsset.id}`;
    if (!savedAsset.registrationDueDate || !isBefore(parseISO(savedAsset.registrationDueDate), thirtyDaysFromNow)) {
      if (notifications.some(n => n.id === regNotifId)) notificationPromises.push(deleteNotification(regNotifId));
    }

    const insNotifId = `expiry-ins-${savedAsset.id}`;
    if (!savedAsset.insuranceDueDate || !isBefore(parseISO(savedAsset.insuranceDueDate), thirtyDaysFromNow)) {
      if (notifications.some(n => n.id === insNotifId)) notificationPromises.push(deleteNotification(insNotifId));
    }

    if (notificationPromises.length > 0) await Promise.all(notificationPromises);

    handleDialogOpenChange(false);
  }

  async function removeAsset(assetId: string) {
    const assetToRemove = assets.find(a => a.id === assetId);
    await deleteFleetAsset(assetId);
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    toast({ title: 'Asset Removed', description: `${assetToRemove?.name} has been removed from the fleet.`, variant: 'destructive' });

    const notifications = await getNotifications();
    const relatedNotificationIds = notifications.filter(n => n.id.endsWith(`-${assetId}`)).map(n => n.id);
    if (relatedNotificationIds.length > 0) {
      await Promise.all(relatedNotificationIds.map(id => deleteNotification(id)));
    }
  }

  const DateCell = ({ dateString }: { dateString?: string | null }) => {
    if (!dateString) return <TableCell className="text-muted-foreground">N/A</TableCell>;
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = addDays(today, 30);
    let textColor = '';
    if (isBefore(date, today)) textColor = 'text-destructive font-bold';
    else if (isBefore(date, thirtyDaysFromNow)) textColor = 'text-yellow-500 font-semibold';
    return (<TableCell className={cn(textColor)}>{format(date, 'PPP')}</TableCell>);
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
        <CardHeader><CardTitle className="flex items-center gap-2">{renderIcon(type)} {title}</CardTitle></CardHeader>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(asset)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAssetToDelete(asset)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
              icon={type === 'truck' ? Truck : type === 'trailer' ? Box : Shovel}
              title={`No ${title.toLowerCase()} added yet`}
              message="Add a vehicle to get started."
              actionLabel="Add Asset"
              onAction={() => {
                form.reset({ type, name: '', vin: '' });
                setEditingAsset(null);
                setIsDialogOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  const registrationFile = form.watch('registrationDocument');
  const insuranceFile = form.watch('insuranceDocument');

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader
          title="Manage Fleet Assets"
          description="Add, view, and remove the vehicles and equipment in your fleet."
          icon={Cog}
        >
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-5 w-5" />Add New Asset</Button></DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader><DialogTitle>{editingAsset ? 'Edit Fleet Asset' : 'Add New Fleet Asset'}</DialogTitle><DialogDescription>Add a new truck, trailer, or piece of equipment to your fleet list.</DialogDescription></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (<FormItem> <FormLabel>Asset Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select an asset type" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="truck">Truck</SelectItem> <SelectItem value="trailer">Trailer</SelectItem> <SelectItem value="heavyEquipment">Heavy Equipment</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem> <FormLabel>Name / Identifier</FormLabel> <FormControl><Input placeholder="e.g., Truck 01, Big Tex Trailer" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                  </div>
                  <FormField control={form.control} name="vin" render={({ field }) => (<FormItem> <FormLabel>VIN / Serial Number</FormLabel> <FormControl><Input placeholder="Enter VIN or serial number" {...field} /></FormControl><FormMessage /> </FormItem>)} />
                  <Separator />
                  <h3 className="text-lg font-medium">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="year" render={({ field }) => (<FormItem> <FormLabel>Year</FormLabel> <FormControl><Input placeholder="e.g., 2022" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    <FormField control={form.control} name="make" render={({ field }) => (<FormItem> <FormLabel>Make</FormLabel> <FormControl><Input placeholder="e.g., Ford" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                    <FormField control={form.control} name="model" render={({ field }) => (<FormItem> <FormLabel>Model</FormLabel> <FormControl><Input placeholder="e.g., F-550" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                  </div>
                  <Separator />
                  <h3 className="text-lg font-medium">Documents &amp; Expiration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField control={form.control} name="registrationDueDate" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>Registration Due Date</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} captionLayout="dropdown-nav" fromYear={getYear(new Date()) - 10} toYear={getYear(new Date()) + 10} initialFocus /></PopoverContent> </Popover> <FormMessage /> </FormItem>)} />
                      <FormField control={form.control} name="registrationDocument" render={({ field }) => (<FormItem> <FormLabel>Registration Document</FormLabel> <div className="flex items-center gap-2"> <Button type="button" variant="outline" size="sm" onClick={() => regFileInputRef.current?.click()} disabled={isUploadingReg}>{isUploadingReg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}Upload</Button> <Input type="file" ref={regFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'registration')} /> {registrationFile && <span className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />{registrationFile.name}</span>} {editingAsset?.documentIds?.length && <Link href={`/admin/manage-documents`}><Button variant="link" size="sm"><LinkIcon />View existing</Button></Link>} </div> </FormItem>)} />
                    </div>
                    <div className="space-y-4">
                      <FormField control={form.control} name="insuranceDueDate" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>Insurance Due Date</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} captionLayout="dropdown-nav" fromYear={getYear(new Date()) - 10} toYear={getYear(new Date()) + 10} initialFocus /></PopoverContent> </Popover> <FormMessage /> </FormItem>)} />
                      <FormField control={form.control} name="insuranceDocument" render={({ field }) => (<FormItem> <FormLabel>Insurance Document</FormLabel> <div className="flex items-center gap-2"> <Button type="button" variant="outline" size="sm" onClick={() => insFileInputRef.current?.click()} disabled={isUploadingIns}>{isUploadingIns ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}Upload</Button> <Input type="file" ref={insFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'insurance')} /> {insuranceFile && <span className="text-sm text-muted-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />{insuranceFile.name}</span>} {editingAsset?.documentIds?.length && <Link href={`/admin/manage-documents`}><Button variant="link" size="sm"><LinkIcon />View existing</Button></Link>} </div> </FormItem>)} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Preventative Maintenance Schedule</h3>
                      <Button type="button" variant="outline" size="sm" onClick={handleSuggestSchedule} disabled={isSuggesting}>
                        {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Suggest Schedule
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ScheduleItemField form={form} name="maintenanceSchedule.oilChange" label="Oil Change" />
                      <ScheduleItemField form={form} name="maintenanceSchedule.tireRotation" label="Tire Rotation" />
                      <ScheduleItemField form={form} name="maintenanceSchedule.brakeInspection" label="Brake Inspection" />
                      <ScheduleItemField form={form} name="maintenanceSchedule.fluidCheck" label="Fluid Check" />
                    </div>
                  </div>
                  <DialogFooter className="pt-4"><Button type="submit">Save Asset</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="space-y-6 animate-fade-in-up mt-6">
          {renderAssetsTable('truck', 'Trucks')}
          {renderAssetsTable('trailer', 'Trailers')}
          {renderAssetsTable('heavyEquipment', 'Heavy Equipment')}
        </div>
      </div>
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the asset
              <span className="font-bold"> {assetToDelete?.name} </span>
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assetToDelete) {
                  removeAsset(assetToDelete.id);
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
