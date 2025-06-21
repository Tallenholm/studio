
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadUsers, loadViolations, saveViolations } from '@/lib/localStorageService';
import type { User, Violation } from '@/lib/types';
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
import { PlusCircle, Trash2, ShieldAlert, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const violationSchema = z.object({
  employeeId: z.string({ required_error: 'Please select an employee.' }),
  date: z.date({ required_error: 'A date is required.' }),
  type: z.enum(['safety', 'conduct', 'performance', 'other'], { required_error: 'Violation type is required.' }),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  actionTaken: z.string().min(1, 'Action taken is required.'),
});

export default function ManageViolationsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof violationSchema>>({
    resolver: zodResolver(violationSchema),
    defaultValues: {
      type: 'safety',
      description: '',
      actionTaken: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers());
    setViolations(loadViolations().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveViolations(violations);
    }
  }, [violations, isMounted]);

  function onSubmit(values: z.infer<typeof violationSchema>) {
    const employee = users.find(u => u.id === values.employeeId);
    if (!employee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
        return;
    }

    const newViolation: Violation = {
      id: `vio-${Date.now()}`,
      employeeName: employee.name,
      date: values.date.toISOString().split('T')[0],
      ...values,
    };
    setViolations(prev => [newViolation, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: 'Violation Logged', description: `Violation for ${employee.name} has been recorded.` });
    setIsDialogOpen(false);
    form.reset({ type: 'safety', description: '', actionTaken: '' });
  }

  function removeViolation(violationId: string) {
    const violationToRemove = violations.find(v => v.id === violationId);
    setViolations(prev => prev.filter(v => v.id !== violationId));
    toast({
      title: 'Violation Removed',
      description: `The violation record for ${violationToRemove?.employeeName} has been deleted.`,
      variant: 'destructive',
    });
  }
  
  const getViolationTypeLabel = (type: Violation['type']) => {
    switch(type) {
        case 'safety': return 'Safety';
        case 'conduct': return 'Conduct';
        case 'performance': return 'Performance';
        case 'other': return 'Other';
    }
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Violation Records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/60 backdrop-blur-xl border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-primary" />
                Manage Employee Violations
              </CardTitle>
              <CardDescription className="mt-2">
                Log, view, and manage employee violations for safety, conduct, and performance.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Log New Violation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log a New Violation</DialogTitle>
                  <DialogDescription>
                    Fill out the details for the incident. This record is for internal use.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Employee</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an employee" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {users.map(user => (
                                      <SelectItem key={user.id} value={user.id}>
                                          {user.name}
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
                              <FormLabel>Date of Incident</FormLabel>
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
                      name="type"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Violation Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a violation type" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="safety">Safety Violation</SelectItem>
                                  <SelectItem value="conduct">Conduct Issue</SelectItem>
                                  <SelectItem value="performance">Performance Issue</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Incident</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Provide a detailed, objective description of the violation." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="actionTaken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Taken</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Verbal warning, written warning, retraining scheduled" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Save Record</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
            <Card>
                <CardHeader>
                    <CardTitle>Violation Log</CardTitle>
                </CardHeader>
                <CardContent>
                    {violations.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Action Taken</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {violations.map(v => (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-medium">{v.employeeName}</TableCell>
                                        <TableCell>{format(new Date(v.date), 'PPP')}</TableCell>
                                        <TableCell>{getViolationTypeLabel(v.type)}</TableCell>
                                        <TableCell className="max-w-sm truncate">{v.description}</TableCell>
                                        <TableCell className="max-w-xs truncate">{v.actionTaken}</TableCell>
                                        <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => removeViolation(v.id)} aria-label={`Remove violation for ${v.employeeName}`}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No violation records found.</div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
