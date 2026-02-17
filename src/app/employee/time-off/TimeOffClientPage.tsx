'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TimeOffRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Calendar as CalendarIcon, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useUser } from '@/firebase/provider';
import { Badge } from '@/components/ui/badge';
import { addTimeOffRequest } from '@/lib/firestoreService';

const requestSchema = z.object({
    dateRange: z.object({
        from: z.date({ required_error: 'A start date is required.' }),
        to: z.date({ required_error: 'An end date is required.' }),
    }),
    reason: z.string().min(10, 'Please provide a brief reason for your request (min. 10 characters).'),
});

interface TimeOffClientPageProps {
  initialRequests: TimeOffRequest[];
}

export default function TimeOffClientPage({ initialRequests }: TimeOffClientPageProps) {
    const [requests, setRequests] = useState<TimeOffRequest[]>(initialRequests);
    const { toast } = useToast();
    const { user } = useUser();

    const form = useForm<z.infer<typeof requestSchema>>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof requestSchema>) {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to make a request.' });
            return;
        }
        const newRequestData: Omit<TimeOffRequest, 'id'> = {
            employeeId: user.uid,
            employeeName: user.name,
            startDate: values.dateRange.from.toISOString().split('T')[0],
            endDate: values.dateRange.to.toISOString().split('T')[0],
            reason: values.reason,
            status: 'pending',
        };

        const newId = await addTimeOffRequest(newRequestData);
        setRequests(prev => [{ id: newId, ...newRequestData }, ...prev].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));

        toast({ title: 'Request Submitted', description: 'Your time off request has been submitted for review.' });
        form.reset();
    }

    const getStatusBadgeVariant = (status: TimeOffRequest['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'denied': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'outline';
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-2">
                        <CalendarPlus className="h-8 w-8 text-primary" />
                        Request Time Off
                    </CardTitle>
                    <CardDescription>Submit a new request for vacation, sick leave, or other time off. Your request will be reviewed by a manager.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="dateRange"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start & End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            id="date"
                                                            variant={"outline"}
                                                            className={cn(
                                                                "justify-start text-left font-normal",
                                                                !field.value?.from && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value?.from ? (
                                                                field.value.to ? (
                                                                    <>
                                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                                        {format(field.value.to, "LLL dd, y")}
                                                                    </>
                                                                ) : (
                                                                    format(field.value.from, "LLL dd, y")
                                                                )
                                                            ) : (
                                                                <span>Pick a date range</span>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={field.value?.from}
                                                        selected={{ from: field.value?.from, to: field.value?.to }}
                                                        onSelect={field.onChange}
                                                        numberOfMonths={2}
                                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for Request</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g., Family vacation, personal appointment, etc."
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">
                                    <Send className="mr-2 h-5 w-5" />
                                    Submit Request
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">
                        My Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{format(parseISO(req.startDate), 'PPP')}</TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{format(parseISO(req.endDate), 'PPP')}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.reason}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(req.status)} className={cn(req.status === 'approved' && 'bg-primary')}>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">You have not submitted any requests yet.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
