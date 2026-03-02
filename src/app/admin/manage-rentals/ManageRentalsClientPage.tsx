
'use client';

import { useState } from 'react';
import type { Rental, FleetAsset } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addRental, updateRental, deleteRental } from '@/lib/firestoreService';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Pencil, MoreHorizontal, ArrowRightLeft, Calendar as CalendarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/common/EmptyState';
import { getRentalStatus } from '@/lib/job-utils';
import { Badge } from '@/components/ui/badge';

const rentalSchema = z.object({
  assetId: z.string({ required_error: 'Please select an asset to rent.' }),
  renterName: z.string().min(1, 'Renter name is required.'),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
  rate: z.coerce.number().min(0, 'Rate must be a positive number.'),
  rateType: z.enum(['daily', 'weekly', 'monthly']),
  contactInfo: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});

interface ManageRentalsClientPageProps {
  initialAssets: FleetAsset[];
  initialRentals: Rental[];
}

export default function ManageRentalsClientPage({ initialAssets, initialRentals }: ManageRentalsClientPageProps) {
  const [assets] = useState<FleetAsset[]>(initialAssets);
  const [rentals, setRentals] = useState<Rental[]>(initialRentals.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof rentalSchema>>({
    resolver: zodResolver(rentalSchema),
    defaultValues: { rateType: 'daily' },
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingRental(null);
      form.reset({ renterName: '', rateType: 'daily', rate: 0, notes: '', contactInfo: '' });
    }
  };

  const handleEditClick = (rental: Rental) => {
    setEditingRental(rental);
    form.reset({
      ...rental,
      dateRange: { from: parseISO(rental.startDate), to: parseISO(rental.endDate) }
    });
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof rentalSchema>) {
    const asset = assets.find(a => a.id === values.assetId);
    if (!asset) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected asset not found.' });
      return;
    }
    const rentalData = {
      assetId: values.assetId,
      assetName: asset.name,
      renterName: values.renterName,
      startDate: format(values.dateRange.from, 'yyyy-MM-dd'),
      endDate: format(values.dateRange.to, 'yyyy-MM-dd'),
      rate: values.rate,
      rateType: values.rateType,
      contactInfo: values.contactInfo,
      notes: values.notes,
    };

    if (editingRental) {
      await updateRental(editingRental.id, rentalData);
      setRentals(prev => prev.map(r => (r.id === editingRental.id ? { id: r.id, ...rentalData } : r)));
      toast({ title: 'Rental Updated' });
    } else {
      const newId = await addRental(rentalData);
      setRentals(prev => [{ id: newId, ...rentalData }, ...prev].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      toast({ title: 'Rental Added' });
    }
    handleDialogOpenChange(false);
  }

  async function removeRental(rentalId: string) {
    await deleteRental(rentalId);
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    toast({ title: 'Rental Deleted', variant: 'destructive' });
  }

  const getStatusBadgeVariant = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'upcoming': return 'outline';
    }
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Rentals" description="Track third-party equipment rentals." icon={ArrowRightLeft}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-5 w-5" />New Rental</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader><DialogTitle>{editingRental ? 'Edit Rental' : 'New Rental'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <FormField control={form.control} name="assetId" render={({ field }) => (<FormItem><FormLabel>Asset</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an asset..." /></SelectTrigger></FormControl><SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="renterName" render={({ field }) => (<FormItem><FormLabel>Renter Name</FormLabel><FormControl><Input placeholder="e.g., ABC Construction" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dateRange" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>Rental Period</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}</Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={{ from: field.value?.from, to: field.value?.to }} onSelect={field.onChange} numberOfMonths={2} /></PopoverContent> </Popover> <FormMessage /> </FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="rate" render={({ field }) => (<FormItem><FormLabel>Rate</FormLabel><FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rateType" render={({ field }) => (<FormItem><FormLabel>Rate Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="contactInfo" render={({ field }) => (<FormItem><FormLabel>Contact Info (Optional)</FormLabel><FormControl><Input placeholder="e.g., 555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Add any special notes" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter><Button type="submit">Save Rental</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="mt-8 animate-fade-in-up">
          {rentals.length > 0 ? (
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Renter</TableHead><TableHead>Period</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rentals.map(rental => (
                    <TableRow key={rental.id}>
                      <TableCell className="font-medium">{rental.assetName}</TableCell>
                      <TableCell>{rental.renterName}</TableCell>
                      <TableCell>{format(parseISO(rental.startDate), 'PP')} - {format(parseISO(rental.endDate), 'PP')}</TableCell>
                      <TableCell>${rental.rate}/{rental.rateType}</TableCell>
                      <TableCell><Badge variant={getStatusBadgeVariant(getRentalStatus(rental))} className={cn(getRentalStatus(rental) === 'active' && 'bg-primary')}>{getRentalStatus(rental)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleEditClick(rental)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setRentalToDelete(rental)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={ArrowRightLeft} title="No Rentals Found" message="Click 'New Rental' to log the first one." onAction={() => setIsDialogOpen(true)} actionLabel="New Rental" />
          )}
        </div>
      </div>
      <AlertDialog open={!!rentalToDelete} onOpenChange={(open) => !open && setRentalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the rental for "{rentalToDelete?.assetName}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (rentalToDelete) removeRental(rentalToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
