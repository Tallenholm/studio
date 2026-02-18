
'use client';

import { useState } from 'react';
import type { Violation, User } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addViolation, deleteViolation } from '@/lib/firestoreService';
import { Button, buttonVariants } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/common/EmptyState';

const violationSchema = z.object({
  employeeId: z.string({ required_error: 'Please select an employee.' }),
  date: z.date({ required_error: 'A date is required.' }),
  type: z.enum(['safety', 'conduct', 'performance', 'other'], { required_error: 'Please select a violation type.' }),
  description: z.string().min(1, 'Description is required.'),
  actionTaken: z.string().min(1, 'Action taken is required.'),
});

interface ManageViolationsClientPageProps {
  initialUsers: User[];
  initialViolations: Violation[];
}

export default function ManageViolationsClientPage({ initialUsers, initialViolations }: ManageViolationsClientPageProps) {
  const [users] = useState<User[]>(initialUsers.filter(u => u.role === 'employee'));
  const [violations, setViolations] = useState<Violation[]>(initialViolations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [violationToDelete, setViolationToDelete] = useState<Violation | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof violationSchema>>({
    resolver: zodResolver(violationSchema),
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    }
  };

  async function onSubmit(values: z.infer<typeof violationSchema>) {
    const employee = users.find(u => u.id === values.employeeId);
    if (!employee) return;

    const violationData = {
      ...values,
      employeeName: employee.name,
      date: format(values.date, 'yyyy-MM-dd'),
    };
    
    const newId = await addViolation(violationData);
    setViolations(prev => [{ id: newId, ...violationData }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: 'Violation Logged', description: `A violation for ${employee.name} has been recorded.` });
    handleDialogOpenChange(false);
  }

  async function removeViolation(violationId: string) {
    await deleteViolation(violationId);
    setViolations(prev => prev.filter(v => v.id !== violationId));
    toast({ title: 'Violation Removed', variant: 'destructive' });
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Violations" description="Log and track employee violations for internal records." icon={ShieldAlert}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-5 w-5" />Log Violation</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log a New Violation</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>Employee</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Incident</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-auto h-4 w-4 opacity-50" />{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Violation Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="safety">Safety</SelectItem><SelectItem value="conduct">Conduct</SelectItem><SelectItem value="performance">Performance</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the incident" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="actionTaken" render={({ field }) => (<FormItem><FormLabel>Action Taken</FormLabel><FormControl><Input placeholder="e.g., Verbal warning, written warning" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter><Button type="submit">Save Log</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>
        
        <div className="mt-8 animate-fade-in-up">
          {violations.length > 0 ? (
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {violations.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>{format(parseISO(v.date), 'PP')}</TableCell>
                      <TableCell>{v.employeeName}</TableCell>
                      <TableCell className="capitalize">{v.type}</TableCell>
                      <TableCell className="text-muted-foreground">{v.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setViolationToDelete(v)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={ShieldAlert} title="No Violations Logged" message="Click 'Log Violation' to add the first one." onAction={() => setIsDialogOpen(true)} actionLabel="Log Violation" />
          )}
        </div>
      </div>
      <AlertDialog open={!!violationToDelete} onOpenChange={(open) => !open && setViolationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this violation log.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(violationToDelete) removeViolation(violationToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
