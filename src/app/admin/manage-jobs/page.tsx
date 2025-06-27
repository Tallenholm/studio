
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { PlusCircle, Trash2, Briefcase, Loader2, Calendar as CalendarIcon, Pencil, Filter, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const jobSchema = z.object({
  name: z.string().min(1, 'Job name is required.'),
  clientId: z.string({ required_error: 'Please select a client.' }),
  address: z.string().min(1, 'Job address is required.'),
  jobValue: z.coerce.number().optional(),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
}).refine((data) => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});


const getJobStatus = (job: Job): JobStatus => {
  const today = startOfDay(new Date());
  const startDate = new Date(job.startDate);
  const endDate = new Date(job.endDate);

  if (isBefore(today, startDate)) {
    return 'upcoming';
  } else if (isAfter(today, endDate)) {
    return 'completed';
  } else {
    return 'active';
  }
};

export default function ManageJobsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setEditingJob(null);
    }
  };

  const handleEditClick = (job: Job) => {
    setEditingJob(job);
    form.reset({
      name: job.name,
      clientId: job.clientId,
      address: job.address,
      jobValue: job.jobValue,
      dateRange: {
        from: new Date(job.startDate),
        to: new Date(job.endDate),
      },
    });
    setIsDialogOpen(true);
  };

  function onSubmit(values: z.infer<typeof jobSchema>) {
    const client = clients.find(c => c.id === values.clientId);
    if (!client) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected client not found.' });
        return;
    }

    if (editingJob) {
        const updatedJob: Job = {
            ...editingJob,
            name: values.name,
            clientId: client.id,
            clientName: client.name,
            address: values.address,
            jobValue: values.jobValue,
            startDate: values.dateRange.from.toISOString().split('T')[0],
            endDate: values.dateRange.to.toISOString().split('T')[0],
        };
        setJobs(prev => prev.map(j => j.id === editingJob.id ? updatedJob : j));
        toast({ title: 'Job Updated', description: `Job "${values.name}" has been updated.` });
    } else {
        const newJob: Job = {
        id: `job-${Date.now()}`,
        name: values.name,
        clientId: client.id,
        clientName: client.name,
        address: values.address,
        jobValue: values.jobValue,
        startDate: values.dateRange.from.toISOString().split('T')[0],
        endDate: values.dateRange.to.toISOString().split('T')[0],
      };
      setJobs((prev) => [...prev, newJob]);
      toast({ title: 'Job Added', description: `Job "${values.name}" has been created.` });
    }
    
    handleDialogOpenChange(false);
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
  
  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'upcoming': return 'outline';
      default: return 'outline';
    }
  };
  
  const jobsWithStatus = useMemo(() => {
    return jobs.map(job => ({
        ...job,
        status: getJobStatus(job)
    })).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobsWithStatus.filter(job => {
        const searchMatch = searchTerm === '' || 
                            job.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.address.toLowerCase().includes(searchTerm.toLowerCase());
        const clientMatch = clientFilter === 'all' || job.clientId === clientFilter;
        const statusMatch = statusFilter === 'all' || job.status === statusFilter;
        return searchMatch && clientMatch && statusMatch;
    });
  }, [jobsWithStatus, searchTerm, clientFilter, statusFilter]);

  const upcomingJobs = filteredJobs.filter(j => j.status === 'upcoming');
  const activeJobs = filteredJobs.filter(j => j.status === 'active');
  const completedJobs = filteredJobs.filter(j => j.status === 'completed');

  const totalActiveValue = useMemo(() => {
    return activeJobs.reduce((acc, job) => acc + (job.jobValue || 0), 0);
  }, [activeJobs]);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  const renderJobsTable = (jobList: (Job & { status: JobStatus })[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({jobList.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {jobList.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Job Value</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobList.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(job.status)} className={cn(job.status === 'active' && 'bg-green-600')}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.clientName}</TableCell>
                    <TableCell>{job.address}</TableCell>
                    <TableCell>{formatCurrency(job.jobValue)}</TableCell>
                    <TableCell>{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleEditClick(job)} aria-label={`Edit job ${job.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} jobs found with current filters.</div>
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
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
                  <DialogDescription>
                    {editingJob ? 'Update the details for this job.' : 'Enter the details for a new job.'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="jobValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Value (Optional)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 25000.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
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
          <Card className="bg-muted/30">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total Active Value</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(totalActiveValue)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    placeholder="Search by name or address..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                 <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by client..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
          </Card>

          {renderJobsTable(activeJobs, "Active Jobs")}
          {renderJobsTable(upcomingJobs, "Upcoming Jobs")}
          {renderJobsTable(completedJobs, "Completed Jobs")}
        </CardContent>
      </Card>
    </div>
  );
}
