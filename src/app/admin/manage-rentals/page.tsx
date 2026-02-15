

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getFleetAssets, getRentals, addRental, updateRental, deleteRental } from '@/lib/firestoreService';
import type { FleetAsset, Rental, JobStatus } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Calendar as CalendarIcon, Pencil, MoreHorizontal, Eye, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRentalStatus } from '@/lib/job-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const rentalSchema = z.object({
  assetId: z.string({ required_error: 'Please select an asset to rent.' }),
  renterName: z.string().min(1, 'Renter name is required.'),
  contactInfo: z.string().optional(),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
  rate: z.coerce.number().min(0.01, 'Rate must be a positive number.'),
  rateType: z.enum(['daily', 'weekly', 'monthly']),
  notes: z.string().optional(),
}).refine((data) => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});

export default function ManageRentalsPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof rentalSchema>>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      rateType: 'daily',
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [assetsData, rentalsData] = await Promise.all([
          getFleetAssets(),
          getRentals()
        ]);
        setAssets(assetsData);
        setRentals(rentalsData);
      } catch (error) {
        console.error("Error fetching rental data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load rental data.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ rateType: 'daily', renterName: '', assetId: undefined });
      setEditingRental(null);
    }
  };

  const handleEditClick = (rental: Rental) => {
    setEditingRental(rental);
    form.reset({
      ...rental,
      dateRange: {
        from: parseISO(rental.startDate),
        to: parseISO(rental.endDate),
      },
    });
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof rentalSchema>) {
    const asset = assets.find(a => a.id === values.assetId);
    if (!asset) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected asset not found.' });
      return;
    }

    const { dateRange, ...otherValues } = values;
    const rentalData = {
      ...otherValues,
      assetName: asset.name,
      startDate: dateRange.from.toISOString().split('T')[0],
      endDate: dateRange.to.toISOString().split('T')[0],
    };

    if (editingRental) {
      const updatedRental = { ...rentalData, startDate: rentalData.startDate, endDate: rentalData.endDate, dateRange: undefined } as unknown as Omit<Rental, 'id'>;
      await updateRental(editingRental.id, updatedRental);
      setRentals(prev => prev.map(r => r.id === editingRental.id ? { id: editingRental.id, ...updatedRental } : r));
      toast({ title: 'Rental Updated', description: `Rental for ${asset.name} has been updated.` });
    } else {
      const newRentalData = { ...rentalData, dateRange: undefined } as unknown as Omit<Rental, 'id'>;
      const newId = await addRental(newRentalData);
      const newRental = { id: newId, ...newRentalData };
      setRentals(prev => [...prev, newRental]);
      toast({ title: 'Rental Created', description: `Rental for ${asset.name} has been created.` });
    }

    handleDialogOpenChange(false);
  }

  async function removeRental(rentalId: string) {
    const rentalToRemove = rentals.find(r => r.id === rentalId);
    await deleteRental(rentalId);
    setRentals(prev => prev.filter(r => r.id !== rentalId));
    toast({
      title: 'Rental Removed',
      description: `Rental for "${rentalToRemove?.assetName}" has been removed.`,
      variant: 'destructive',
    });
  }

  const rentalsWithStatus = useMemo(() => {
    return rentals.map(rental => ({
      ...rental,
      status: getRentalStatus(rental)
    })).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [rentals]);

  const upcomingRentals = rentalsWithStatus.filter(r => r.status === 'upcoming');
  const activeRentals = rentalsWithStatus.filter(r => r.status === 'active');
  const completedRentals = rentalsWithStatus.filter(r => r.status === 'completed');

  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'upcoming': return 'outline';
      default: return 'outline';
    }
  };

  const renderRentalsTable = (rentalList: (Rental & { status: JobStatus })[]) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Renter</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentalList.length > 0 ? rentalList.map(rental => (
            <TableRow key={rental.id}>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(rental.status)} className={cn(rental.status === 'active' && 'bg-green-600')}>
                  {rental.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{rental.assetName}</TableCell>
              <TableCell>{rental.renterName}</TableCell>
              <TableCell>{format(new Date(rental.startDate), 'PPP')} - {format(new Date(rental.endDate), 'PPP')}</TableCell>
              <TableCell>${rental.rate.toFixed(2)} / {rental.rateType}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleEditClick(rental)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setRentalToDelete(rental)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">No rentals in this category.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Rentals...</p>
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
                  <ArrowRightLeft className="h-8 w-8 text-primary" />
                  Manage Rentals
                </CardTitle>
                <CardDescription className="mt-2">
                  Create and track equipment rentals.
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Rental
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingRental ? 'Edit Rental' : 'Create New Rental'}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="assetId" render={({ field }) => (<FormItem> <FormLabel>Asset</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select an asset" /></SelectTrigger></FormControl> <SelectContent>{assets.map(asset => (<SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="dateRange" render={({ field }) => (<FormItem className="flex flex-col"> <FormLabel>Rental Period</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}</Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={{ from: field.value?.from, to: field.value?.to }} onSelect={field.onChange} numberOfMonths={2} /></PopoverContent> </Popover> <FormMessage /> </FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="renterName" render={({ field }) => (<FormItem> <FormLabel>Renter Name</FormLabel> <FormControl><Input placeholder="e.g., Friendly Farms" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="contactInfo" render={({ field }) => (<FormItem> <FormLabel>Contact Info (Optional)</FormLabel> <FormControl><Input placeholder="e.g., 555-123-4567" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="rate" render={({ field }) => (<FormItem> <FormLabel>Rate</FormLabel> <FormControl><Input type="number" placeholder="e.g., 350" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                        <FormField control={form.control} name="rateType" render={({ field }) => (<FormItem> <FormLabel>Rate Type</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select rate type" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="daily">Daily</SelectItem> <SelectItem value="weekly">Weekly</SelectItem> <SelectItem value="monthly">Monthly</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem>)} />
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (<FormItem> <FormLabel>Notes (Optional)</FormLabel> <FormControl><Textarea placeholder="e.g., Rented for post-storm cleanup." {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                      <DialogFooter>
                        <Button type="submit">Save Rental</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {rentalsWithStatus.length > 0 ? (
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">Active ({activeRentals.length})</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming ({upcomingRentals.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completedRentals.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-4">{renderRentalsTable(activeRentals)}</TabsContent>
                <TabsContent value="upcoming" className="mt-4">{renderRentalsTable(upcomingRentals)}</TabsContent>
                <TabsContent value="completed" className="mt-4">{renderRentalsTable(completedRentals)}</TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                <h3 className="text-xl font-semibold text-foreground">No Rentals Found</h3>
                <p className="mt-2">Click "New Rental" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!rentalToDelete} onOpenChange={(open) => !open && setRentalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the rental for
              <span className="font-bold"> {rentalToDelete?.assetName}</span> by <span className="font-bold">{rentalToDelete?.renterName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rentalToDelete) {
                  removeRental(rentalToDelete.id);
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
