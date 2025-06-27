
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadClients, loadJobs, saveJobs, loadFleetAssets } from '@/lib/localStorageService';
import type { Client, Job, JobStatus, FleetAsset, VehicleType } from '@/lib/types';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Briefcase, Loader2, Calendar as CalendarIcon, Pencil, Filter, DollarSign, MoreHorizontal, Eye, Truck, Box, Shovel, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getJobStatus } from '@/lib/job-utils';
import { createJobFromPrompt } from '@/ai/flows/create-job-from-prompt';
import { Textarea } from '@/components/ui/textarea';


const jobSchema = z.object({
  name: z.string().min(1, 'Job name is required.'),
  clientId: z.string({ required_error: 'Please select a client.' }),
  address: z.string().min(1, 'Job address is required.'),
  jobValue: z.coerce.number().optional(),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
  assignedTruckIds: z.array(z.string()).optional(),
  assignedTrailerIds: z.array(z.string()).optional(),
  assignedHeavyEquipmentIds: z.array(z.string()).optional(),
}).refine((data) => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});


export default function ManageJobsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingJob, setIsGeneratingJob] = useState(false);
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
      assignedTruckIds: [],
      assignedTrailerIds: [],
      assignedHeavyEquipmentIds: [],
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setClients(loadClients());
    setJobs(loadJobs());
    setFleetAssets(loadFleetAssets());
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveJobs(jobs);
    }
  }, [jobs, isMounted]);

  const { trucks, trailers, heavyEquipments } = useMemo(() => ({
    trucks: fleetAssets.filter(a => a.type === 'truck'),
    trailers: fleetAssets.filter(a => a.type === 'trailer'),
    heavyEquipments: fleetAssets.filter(a => a.type === 'heavyEquipment'),
  }), [fleetAssets]);


  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ name: '', address: '', assignedTruckIds: [], assignedTrailerIds: [], assignedHeavyEquipmentIds: [] });
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
      assignedTruckIds: job.assignedTruckIds || [],
      assignedTrailerIds: job.assignedTrailerIds || [],
      assignedHeavyEquipmentIds: job.assignedHeavyEquipmentIds || [],
    });
    setIsDialogOpen(true);
  };

  async function handleGenerateJob() {
    if (!aiPrompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Prompt cannot be empty.' });
      return;
    }
    setIsGeneratingJob(true);
    try {
      const result = await createJobFromPrompt(aiPrompt);

      const client = clients.find(c => c.name.toLowerCase() === result.clientName.toLowerCase());
      if (!client) {
        toast({ variant: 'destructive', title: 'Client Not Found', description: `Could not find a client named "${result.clientName}". Please add them first.` });
        setIsGeneratingJob(false);
        return;
      }
      
      form.reset({
        name: result.name,
        clientId: client.id,
        address: result.address,
        jobValue: result.jobValue,
        dateRange: {
          from: parseISO(result.startDate),
          to: parseISO(result.endDate),
        },
        assignedTruckIds: [],
        assignedTrailerIds: [],
        assignedHeavyEquipmentIds: [],
      });

      toast({ title: 'Job Populated', description: 'Please review the generated job details and assign assets.' });
      setIsAiDialogOpen(false);
      setIsDialogOpen(true);

    } catch (error) {
      console.error("AI Job Generation Error:", error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to generate job from prompt. Please try again.' });
    } finally {
      setIsGeneratingJob(false);
    }
  }

  function onSubmit(values: z.infer<typeof jobSchema>) {
    const client = clients.find(c => c.id === values.clientId);
    if (!client) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected client not found.' });
        return;
    }

    const jobData = {
      name: values.name,
      clientId: client.id,
      clientName: client.name,
      address: values.address,
      jobValue: values.jobValue,
      startDate: values.dateRange.from.toISOString().split('T')[0],
      endDate: values.dateRange.to.toISOString().split('T')[0],
      assignedTruckIds: values.assignedTruckIds || [],
      assignedTrailerIds: values.assignedTrailerIds || [],
      assignedHeavyEquipmentIds: values.assignedHeavyEquipmentIds || [],
    };

    if (editingJob) {
        const updatedJob: Job = {
            ...editingJob,
            ...jobData,
        };
        setJobs(prev => prev.map(j => j.id === editingJob.id ? updatedJob : j));
        toast({ title: 'Job Updated', description: `Job "${values.name}" has been updated.` });
    } else {
        const newJob: Job = {
        id: `job-${Date.now()}`,
        ...jobData,
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
                  <TableHead>Job Value</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Assigned Assets</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobList.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(job.status)} className={cn(job.status === 'active' && 'bg-primary')}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.clientName}</TableCell>
                    <TableCell>{formatCurrency(job.jobValue)}</TableCell>
                    <TableCell>{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center text-muted-foreground">
                        {(job.assignedTruckIds?.length || 0) > 0 && <Truck className="h-4 w-4" title={`${job.assignedTruckIds?.length} truck(s)`} />}
                        {(job.assignedTrailerIds?.length || 0) > 0 && <Box className="h-4 w-4" title={`${job.assignedTrailerIds?.length} trailer(s)`} />}
                        {(job.assignedHeavyEquipmentIds?.length || 0) > 0 && <Shovel className="h-4 w-4" title={`${job.assignedHeavyEquipmentIds?.length} equipment`} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                             <Link href={`/admin/jobs/${job.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleEditClick(job)}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => removeJob(job.id)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
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

  const AssetMultiSelect = ({ assetType, assets, fieldName }: { assetType: VehicleType, assets: FleetAsset[], fieldName: "assignedTruckIds" | "assignedTrailerIds" | "assignedHeavyEquipmentIds" }) => {
    const selectedIds = form.watch(fieldName) || [];
    const Icon = assetType === 'truck' ? Truck : assetType === 'trailer' ? Box : Shovel;

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> Assign {assetType.charAt(0).toUpperCase() + assetType.slice(1)}s</FormLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select assets...'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>Available {assetType}s</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {assets.map(asset => (
                  <DropdownMenuCheckboxItem
                    key={asset.id}
                    checked={field.value?.includes(asset.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...(field.value || []), asset.id])
                        : field.onChange(field.value?.filter(value => value !== asset.id))
                    }}
                  >
                    {asset.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

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
            <div className="flex gap-2">
              <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Brain className="mr-2 h-5 w-5" /> Create with AI</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                      <DialogHeader>
                          <DialogTitle>Create Job with AI</DialogTitle>
                          <DialogDescription>
                              Describe the job in plain English. The AI will populate the form for you. Include the client name, address, dates, and value.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                          <Textarea 
                            placeholder="e.g., Excavate the foundation for Main Street Properties at 456 Central Ave. Start tomorrow and finish in two weeks. The job is worth $75,000."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="min-h-[120px]"
                          />
                      </div>
                      <DialogFooter>
                          <Button onClick={handleGenerateJob} disabled={isGeneratingJob}>
                              {isGeneratingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Brain className="mr-2 h-4 w-4" />}
                              {isGeneratingJob ? 'Generating...' : 'Generate Job'}
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
                    <DialogDescription>
                      {editingJob ? 'Update the details for this job.' : 'Enter the details for a new job.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
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
                        </div>
                        <div className="space-y-4">
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
                          </div>
                      </div>

                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <AssetMultiSelect assetType="truck" assets={trucks} fieldName="assignedTruckIds" />
                         <AssetMultiSelect assetType="trailer" assets={trailers} fieldName="assignedTrailerIds" />
                         <AssetMultiSelect assetType="heavyEquipment" assets={heavyEquipments} fieldName="assignedHeavyEquipmentIds" />
                      </div>

                      <DialogFooter>
                        <Button type="submit">Save Job</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
                <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total Active Value</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(totalActiveValue)}</p>
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
