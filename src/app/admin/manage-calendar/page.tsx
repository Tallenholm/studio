

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCalendarEvents, addCalendarEvent, deleteCalendarEvent } from '@/lib/firestoreService';
import type { CalendarEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Calendar as CalendarIcon, CalendarPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';


const eventSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  title: z.string().min(1, 'Event title is required.'),
  type: z.enum(['time-off', 'company-event', 'maintenance'], { required_error: 'Event type is required.' }),
  description: z.string().optional(),
});


export default function ManageCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      type: 'company-event',
      description: '',
    },
  });

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const initialEvents = await getCalendarEvents();
            setEvents(initialEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load calendar events.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    const newEventData: Omit<CalendarEvent, 'id'> = {
      date: values.date.toISOString().split('T')[0], // Store date as YYYY-MM-DD
      ...values,
      description: values.description || '',
    };
    
    const newId = await addCalendarEvent(newEventData);
    setEvents((prev) => [...prev, {id: newId, ...newEventData}].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({ title: 'Event Added', description: `${values.title} has been added to the calendar.` });
    form.reset({ title: '', type: 'company-event', description: '' });
  }

  async function removeEvent(eventId: string) {
    const eventToRemove = events.find(e => e.id === eventId);
    await deleteCalendarEvent(eventId);
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    toast({
      title: 'Event Removed',
      description: `${eventToRemove?.title} has been removed from the calendar.`,
      variant: 'destructive',
    });
  }

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'time-off': return 'Time Off';
        case 'company-event': return 'Company Event';
        case 'maintenance': return 'Maintenance';
        default: return 'Event';
    }
  }

  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading Calendar...</p>
        </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
       <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <CalendarPlus className="h-8 w-8 text-primary" />
                Add New Calendar Event
            </CardTitle>
            <CardDescription>Add a new event, time off, or maintenance schedule to the company calendar.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Company Picnic, John D. Vacation" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Event Date</FormLabel>
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
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Event Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an event type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="company-event">Company Event</SelectItem>
                                    <SelectItem value="time-off">Time Off</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
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
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Annual company gathering at the park" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    <div className="flex justify-end">
                        <Button type="submit">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Add Event
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
       </Card>

      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Scheduled Events
          </CardTitle>
        </CardHeader>
        <CardContent>
            {events.length > 0 ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map(event => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium whitespace-nowrap">{format(parseISO(event.date), 'PPP')}</TableCell>
                                <TableCell>{event.title}</TableCell>
                                <TableCell>{getEventTypeLabel(event.type)}</TableCell>
                                <TableCell className="text-muted-foreground">{event.description || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeEvent(event.id)} aria-label={`Remove ${event.title}`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                    <h3 className="text-xl font-semibold text-foreground">No Events Scheduled</h3>
                    <p className="mt-2">Use the form above to add a new company event.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
