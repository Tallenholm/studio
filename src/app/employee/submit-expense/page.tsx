
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadExpenseReports, saveExpenseReports } from '@/lib/localStorageService';
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
import { Receipt, Loader2, Calendar as CalendarIcon, Send, FileUp, Eye, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const expenseSchema = z.object({
  date: z.date({ required_error: 'An expense date is required.' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero.'),
  category: z.enum(['fuel', 'food', 'lodging', 'supplies', 'other'], { required_error: 'Please select a category.' }),
  description: z.string().min(1, 'Description is required.'),
  receiptDataUri: z.string().refine((val) => val.startsWith('data:'), {
    message: 'A receipt photo is required.',
  }),
});

export default function SubmitExpensePage() {
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'fuel',
      description: '',
      receiptDataUri: '',
    },
  });

  useEffect(() => {
    if (user) {
      setIsMounted(true);
      const allReports = loadExpenseReports();
      setReports(allReports.filter(r => r.employeeId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('receiptDataUri', reader.result as string);
        form.clearErrors('receiptDataUri');
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit an expense.' });
        return;
    }
    const newReport: ExpenseReport = {
      id: `${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      date: values.date.toISOString().split('T')[0],
      amount: values.amount,
      category: values.category,
      description: values.description,
      receiptDataUri: values.receiptDataUri,
      status: 'pending',
    };
    
    const allReports = loadExpenseReports();
    saveExpenseReports([...allReports, newReport]);
    setReports(prev => [newReport, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    toast({ title: 'Expense Submitted', description: 'Your expense report has been submitted for review.' });
    form.reset({ category: 'fuel', description: '', receiptDataUri: '' });
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
            <CardDescription>Submit a new expense report for reimbursement. A photo of the receipt is required.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormField
                        control={form.control}
                        name="receiptDataUri"
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
                                      >
                                          <FileUp className="mr-2 h-4 w-4" />
                                          Upload Receipt
                                      </Button>
                                      <Input
                                          type="file"
                                          accept="image/*"
                                          ref={fileInputRef}
                                          className="hidden"
                                          onChange={handleFileChange}
                                      />
                                      {field.value && (
                                          <div className="text-sm flex items-center gap-2">
                                              <Image src={field.value} alt="Preview" width={48} height={48} className="rounded-md" />
                                              <span>Receipt selected.</span>
                                          </div>
                                      )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit">
                            <Send className="mr-2 h-5 w-5" />
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
                                    <Badge variant={getStatusBadgeVariant(req.status)} className={req.status === 'approved' ? 'bg-green-600' : ''}>
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
