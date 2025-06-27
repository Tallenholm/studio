
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadClients, loadJobs, saveJobs } from '@/lib/localStorageService';
import type { Client, Job, JobStatus } from '@/lib/types';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Briefcase, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const jobSchema = z.object({
  name: z.string().min(1, 'Job name is required.'),
  clientId: z.string({ required_error: 'Please select a client.' }),
  address: z.string().min(1, 'Job address is required.'),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
});

export default function ManageJobsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setClients(loadClients());
    setJobs(loadJobs());
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveJobs(jobs);
    }
  }, [jobs, isMounted]);

  function onSubmit(values: z.infer<typeof jobSchema>) {
    const client = clients.find(c => c.id === values.clientId);
    if (!client) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected client not found.' });
        return;
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      name: values.name,
      clientId: client.id,
      clientName: client.name,
      address: values.address,
      startDate: values.dateRange.from.toISOString().split('T')[0],
      endDate: values.dateRange.to.toISOString().split('T')[0],
      status: 'upcoming', // New jobs are always upcoming
    };
    setJobs((prev) => [...prev, newJob].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
    toast({ title: 'Job Added', description: `Job "${values.name}" has been created.` });
    setIsDialogOpen(false);
    form.reset();
  }

  function removeJob(jobId: string) {
    const jobToRemove = jobs.find(j => j.id === jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    toast({
      title: 'Job Removed',
      description: `Job "${jobToRemove?.name}" has been removed.`,
      variant: 'destructive',
    });
  }

  const renderJobsTable = (jobList: Job[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {jobList.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobList.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.clientName}</TableCell>
                    <TableCell>{job.address}</TableCell>
                    <TableCell>{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeJob(job.id)} aria-label={`Remove job ${job.name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} jobs.</div>
        )}
      </CardContent>
    </Card>
  );

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Jobs...</p>
      </div>
    );
  }

  const upcomingJobs = jobs.filter(j => j.status === 'upcoming');
  const activeJobs = jobs.filter(j => j.status === 'active');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Briefcase className="h-8 w-8 text-primary" />
                Manage Jobs
              </CardTitle>
              <CardDescription className="mt-2">
                Assign and track jobs for your clients.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Job</DialogTitle>
                  <DialogDescription>
                    Enter the details for a new job.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lot 5 Excavation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Site Address</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                                  className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value?.from ? (
                                    field.value.to ? (
                                      <>
                                        {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
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
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Save Job</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderJobsTable(activeJobs, "Active Jobs")}
          {renderJobsTable(upcomingJobs, "Upcoming Jobs")}
          {renderJobsTable(completedJobs, "Completed Jobs")}
        </CardContent>
      </Card>
    </div>
  );
}
