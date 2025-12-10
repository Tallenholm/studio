
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addExpenseReport, getExpenseReports } from '@/lib/firestoreService';
import { uploadFile } from '@/lib/firebase';
import type { ExpenseReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Loader2, Calendar as CalendarIcon, Send, FileUp, Eye, DollarSign, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useUser } from '@/firebase/provider';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import Link from 'next/link';

const expenseSchema = z.object({
  date: z.date({ required_error: 'An expense date is required.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero.'),
  category: z.enum(['fuel', 'food', 'lodging', 'supplies', 'other'], { required_error: 'Please select a category.' }),
  description: z.string().min(1, 'Description is required.'),
  receiptPhotoUrl: z.string().url({ message: 'A receipt photo upload is required.' }),
});

export default function SubmitExpensePage() {
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'fuel',
      description: '',
      receiptPhotoUrl: '',
    },
  });

  useEffect(() => {
    async function fetchReports() {
        if (user) {
            setIsMounted(true);
            const allReports = await getExpenseReports();
            setReports(allReports.filter(r => r.employeeId === user.uid).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
    }
    fetchReports();
  }, [user]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsScanning(true);
      
      // First, get the data URI for AI processing
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const dataUriPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      try {
        // Concurrently upload to storage and process with AI
        const uploadPromise = uploadFile(file, `receipts/${user?.id || 'unknown'}/${Date.now()}-${file.name}`);
        const dataUri = await dataUriPromise;
        const ocrPromise = extractReceiptData({ receiptDataUri: dataUri });

        const [downloadUrl, extractedData] = await Promise.all([uploadPromise, ocrPromise]);
        
        form.setValue('receiptPhotoUrl', downloadUrl);
        form.clearErrors('receiptPhotoUrl');
        
        // Populate form with extracted data
        if (extractedData.amount) form.setValue('amount', extractedData.amount);
        if (extractedData.date) form.setValue('date', parseISO(extractedData.date));
        if (extractedData.description) form.setValue('description', extractedData.description);
        
        toast({ title: 'AI Assistant', description: 'Receipt details have been pre-filled.' });

      } catch (error) {
        console.error("File processing error:", error);
        toast({ variant: 'destructive', title: "Processing Failed", description: "Could not upload or scan receipt. Please try again."});
      } finally {
        setIsScanning(false);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit an expense.' });
        return;
    }
    const newReportData: Omit<ExpenseReport, 'id'> = {
      employeeId: user.uid,
      employeeName: user.name,
      date: values.date.toISOString().split('T')[0],
      amount: values.amount,
      category: values.category,
      description: values.description,
      receiptPhotoUrl: values.receiptPhotoUrl,
      status: 'pending',
    };
    
    const newReportId = await addExpenseReport(newReportData);
    setReports(prev => [{ id: newReportId, ...newReportData }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    toast({ title: 'Expense Submitted', description: 'Your expense report has been submitted for review.' });
    form.reset({ category: 'fuel', description: '', receiptPhotoUrl: '', amount: undefined, date: undefined });
  }

  const getStatusBadgeVariant = (status: ExpenseReport['status']) => {
      switch (status) {
          case 'approved': return 'default';
          case 'denied': return 'destructive';
          case 'pending': return 'secondary';
          default: return 'outline';
      }
  }

  const getCategoryLabel = (category: ExpenseReport['category']) => {
      return category.charAt(0).toUpperCase() + category.slice(1);
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Expenses...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
       <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Receipt className="h-8 w-8 text-primary" />
                Submit an Expense
            </CardTitle>
            <CardDescription>Upload a receipt and let the AI assistant help you fill out the report.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="receiptPhotoUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Receipt Photo</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-4">
                                      <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full md:w-auto"
                                          onClick={() => fileInputRef.current?.click()}
                                          disabled={isScanning}
                                      >
                                          {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileUp className="mr-2 h-4 w-4" />}
                                          {isScanning ? 'Scanning with AI...' : 'Upload Receipt'}
                                      </Button>
                                      <Input
                                          type="file"
                                          accept="image/*"
                                          ref={fileInputRef}
                                          className="hidden"
                                          onChange={handleFileChange}
                                          disabled={isScanning}
                                      />
                                      {field.value && (
                                          <Link href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-2 hover:underline">
                                              <Image src={field.value} alt="Preview" width={48} height={48} className="rounded-md" />
                                              <span>Receipt selected.</span>
                                          </Link>
                                      )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Date of Expense</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
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
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 75.50" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="fuel">Fuel</SelectItem>
                                      <SelectItem value="food">Food/Meals</SelectItem>
                                      <SelectItem value="lodging">Lodging</SelectItem>
                                      <SelectItem value="supplies">Supplies</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="e.g., Fuel for Truck 01, Lunch with client"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isScanning || form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-5 w-5" />
                            )}
                            Submit Expense
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
       </Card>

      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            My Expense History
          </CardTitle>
        </CardHeader>
        <CardContent>
            {reports.length > 0 ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium whitespace-nowrap">{format(new Date(req.date), 'PPP')}</TableCell>
                                <TableCell>${req.amount.toFixed(2)}</TableCell>
                                <TableCell className="font-medium">{getCategoryLabel(req.category)}</TableCell>
                                <TableCell className="text-muted-foreground">{req.description}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(req.status)} className={cn(req.status === 'approved' && 'bg-green-600')}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">You have not submitted any expenses yet.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
