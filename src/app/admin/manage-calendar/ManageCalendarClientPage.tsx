
'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/firestoreService';
import { Button, buttonVariants } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Pencil, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmptyState from '@/components/common/EmptyState';

const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required.'),
  date: z.date({ required_error: 'A date is required for the event.' }),
  type: z.enum(['company-event', 'maintenance'], { required_error: 'Event type is required.' }),
  description: z.string().optional(),
});

interface ManageCalendarClientPageProps {
  initialEvents: CalendarEvent[];
}

export default function ManageCalendarClientPage({ initialEvents }: ManageCalendarClientPageProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEvent(null);
      form.reset({ title: '', type: undefined, description: '' });
    }
  };

  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.reset({
      ...event,
      date: parseISO(event.date),
      type: event.type === 'company-event' || event.type === 'maintenance' ? event.type : 'company-event',
    });
    setIsDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    const eventData = {
      ...values,
      date: format(values.date, 'yyyy-MM-dd'),
    };

    if (editingEvent) {
      const updatedEvent = { ...editingEvent, ...eventData };
      await updateCalendarEvent(editingEvent.id, updatedEvent);
      setEvents(prev => prev.map(e => (e.id === editingEvent.id ? updatedEvent : e)));
      toast({ title: 'Event Updated', description: `Event "${values.title}" has been updated.` });
    } else {
      const newId = await addCalendarEvent(eventData);
      setEvents(prev => [{ id: newId, ...eventData } as CalendarEvent, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      toast({ title: 'Event Added', description: `Event "${values.title}" has been added to the calendar.` });
    }
    handleDialogOpenChange(false);
  }
  
  async function removeEvent(eventId: string) {
    const eventToRemove = events.find(e => e.id === eventId);
    await deleteCalendarEvent(eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast({ title: 'Event Deleted', description: `Event "${eventToRemove?.title}" has been deleted.`, variant: 'destructive' });
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Calendar" description="Add, edit, or remove company-wide events." icon={Calendar}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-5 w-5" />Add New Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="e.g., Company BBQ" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-auto h-4 w-4 opacity-50" />{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="company-event">Company Event</SelectItem><SelectItem value="maintenance">Scheduled Maintenance</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Add details about the event" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit">Save Event</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        <div className="mt-8 animate-fade-in-up">
            {events.filter(e => e.type !== 'time-off').length > 0 ? (
                 <div className="border rounded-md bg-card">
                    <Table>
                        <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {events.filter(e => e.type !== 'time-off').map(event => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.title}</TableCell>
                                <TableCell>{format(parseISO(event.date), 'PPP')}</TableCell>
                                <TableCell className="capitalize">{event.type.replace('-', ' ')}</TableCell>
                                <TableCell className="text-right">
                                     <Button variant="ghost" size="icon" onClick={() => handleEditClick(event)}><Pencil className="h-4 w-4"/></Button>
                                     <Button variant="ghost" size="icon" onClick={() => setEventToDelete(event)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <EmptyState icon={Calendar} title="No Company Events" message="Click 'Add New Event' to get started." actionLabel="Add New Event" onAction={() => setIsDialogOpen(true)} />
            )}
        </div>
      </div>
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the event "{eventToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(eventToDelete) removeEvent(eventToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
