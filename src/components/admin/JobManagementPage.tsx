
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getClients, getFleetAssets, getUsers, addJob, getJobs, updateJob, deleteJob } from '@/lib/firestoreService';
import type { Client, Job, JobStatus, FleetAsset, User, JobType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Calendar as CalendarIcon, Pencil, Filter, DollarSign, MoreHorizontal, Eye, Truck, Box, Shovel, Brain, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { getJobStatus } from '@/lib/job-utils';
import { createJobFromPrompt } from '@/ai/flows/create-job-from-prompt';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressAutocomplete from './AddressAutocomplete';


const jobSchema = z.object({
  name: z.string().min(1, 'Job name is required.'),
  clientId: z.string({ required_error: 'Please select a client.' }),
  address: z.string().min(1, 'Job address is required.'),
  jobValue: z.coerce.number().optional(),
  jobType: z.enum(['excavation', 'snow_removal', 'concrete', 'misc']),
  dateRange: z.object({
    from: z.date({ required_error: 'A start date is required.' }),
    to: z.date({ required_error: 'An end date is required.' }),
  }),
  // General Assignments
  assignedEmployeeIds: z.array(z.string()).optional(),
  assignedTruckIds: z.array(z.string()).optional(),
  assignedTrailerIds: z.array(z.string()).optional(),
  assignedHeavyEquipmentIds: z.array(z.string()).optional(),
  // Snow Removal Specific
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  equipmentNeeds: z.string().optional(),
  snowServices: z.object({
    plowing: z.boolean().default(false),
    salting: z.boolean().default(false),
    sidewalks: z.boolean().default(false),
  }).optional(),
  assignedSidewalkCrewIds: z.array(z.string()).optional(),
  // Concrete Specific
  concreteYards: z.coerce.number().optional(),
}).refine((data) => data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});


interface JobManagementPageProps {
    jobType: JobType;
    pageTitle: string;
    pageDescription: string;
    pageIcon: React.ElementType;
    addJobButtonText: string;
    aiPromptExample: string;
}

export default function JobManagementPage({ jobType, pageTitle, pageDescription, pageIcon: PageIcon, addJobButtonText, aiPromptExample }: JobManagementPageProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingJob, setIsGeneratingJob] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      name: '',
      address: '',
      jobType: jobType,
      assignedEmployeeIds: [],
      assignedTruckIds: [],
      assignedTrailerIds: [],
      assignedHeavyEquipmentIds: [],
      assignedSidewalkCrewIds: [],
      snowServices: { plowing: false, salting: false, sidewalks: false },
    },
  });

  const watchedJobType = form.watch('jobType');

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [loadedJobs, loadedClients, loadedAssets, loadedUsers] = await Promise.all([
                getJobs(),
                getClients(),
                getFleetAssets(),
                getUsers(),
            ]);
            setJobs(loadedJobs);
            setClients(loadedClients);
            setFleetAssets(loadedAssets);
            setUsers(loadedUsers.filter(u => u.role === 'employee'));
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load page data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const { trucks, trailers, heavyEquipments } = useMemo(() => ({
    trucks: fleetAssets.filter(a => a.type === 'truck'),
    trailers: fleetAssets.filter(a => a.type === 'trailer'),
    heavyEquipments: fleetAssets.filter(a => a.type === 'heavyEquipment'),
  }), [fleetAssets]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ 
          name: '', address: '', jobType: jobType,
          assignedEmployeeIds: [], assignedTruckIds: [], assignedTrailerIds: [], assignedHeavyEquipmentIds: [], assignedSidewalkCrewIds: [],
          snowServices: { plowing: false, salting: false, sidewalks: false },
          concreteYards: undefined, jobValue: undefined,
      });
      setEditingJob(null);
    }
  };

  const handleAiDialogOpenChange = (open: boolean) => {
    setIsAiDialogOpen(open);
    if (!open) {
        setAiPrompt('');
        setAiError(null);
        setIsGeneratingJob(false);
    }
  }

  const handleEditClick = (job: Job) => {
    setEditingJob(job);
    form.reset({
      name: job.name,
      clientId: job.clientId,
      address: job.address,
      jobValue: job.jobValue,
      jobType: job.jobType,
      dateRange: {
        from: new Date(job.startDate),
        to: new Date(job.endDate),
      },
      openingTime: job.openingTime,
      closingTime: job.closingTime,
      equipmentNeeds: job.equipmentNeeds,
      assignedEmployeeIds: job.assignedEmployeeIds || [],
      assignedTruckIds: job.assignedTruckIds || [],
      assignedTrailerIds: job.assignedTrailerIds || [],
      assignedHeavyEquipmentIds: job.assignedHeavyEquipmentIds || [],
      assignedSidewalkCrewIds: job.assignedSidewalkCrewIds || [],
      snowServices: job.snowServices || { plowing: false, salting: false, sidewalks: false },
      concreteYards: job.concreteYards,
    });
    setIsDialogOpen(true);
  };

  async function handleGenerateJob() {
    if (!aiPrompt.trim()) {
      setAiError('Prompt cannot be empty.');
      return;
    }
    setIsGeneratingJob(true);
    setAiError(null);
    try {
      const result = await createJobFromPrompt(aiPrompt);

      if (result.jobType !== jobType) {
          setAiError(`The AI classified this as a '${result.jobType}' job. Please use the correct management page.`);
          setIsGeneratingJob(false);
          return;
      }

      const client = clients.find(c => c.name.toLowerCase() === result.clientName.toLowerCase());
      if (!client) {
        setAiError(`Client "${result.clientName}" not found. Please add them on the "Manage Clients" page.`);
        setIsGeneratingJob(false);
        return;
      }
      
      form.reset({
        name: result.name,
        clientId: client.id,
        address: result.address,
        jobValue: result.jobValue,
        jobType: result.jobType,
        concreteYards: result.concreteYards,
        dateRange: {
          from: parseISO(result.startDate),
          to: parseISO(result.endDate),
        },
      });

      toast({ title: 'Job Populated', description: 'Please review the generated job details and make assignments.' });
      handleAiDialogOpenChange(false);
      setIsDialogOpen(true);

    } catch (error) {
      console.error("AI Job Generation Error:", error);
      setAiError('Failed to generate job from prompt. The AI may be unavailable or the prompt was too complex.');
    } finally {
      setIsGeneratingJob(false);
    }
  }

  async function onSubmit(values: z.infer<typeof jobSchema>) {
    const client = clients.find(c => c.id === values.clientId);
    if (!client) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected client not found.' });
        return;
    }

    const jobData = {
      ...values,
      clientName: client.name,
      startDate: values.dateRange.from.toISOString().split('T')[0],
      endDate: values.dateRange.to.toISOString().split('T')[0],
    };

    try {
        if (editingJob) {
            const updatedJob: Job = { ...editingJob, ...jobData };
            await updateJob(editingJob.id, updatedJob);
            setJobs(prev => prev.map(j => j.id === editingJob.id ? updatedJob : j));
            toast({ title: 'Job Updated', description: `Job "${values.name}" has been updated.` });
        } else {
            const newJob: Omit<Job, 'id'> = {
                ...jobData,
                notes: [],
                snowLog: values.jobType === 'snow_removal' ? { plowing: [], salting: [], sidewalks: [] } : undefined,
            };
            const newId = await addJob(newJob);
            setJobs(prev => [...prev, {id: newId, ...newJob}]);
            toast({ title: 'Job Added', description: `Job "${values.name}" has been created.` });
        }
        handleDialogOpenChange(false);
    } catch (error) {
        console.error("Firestore Error:", error);
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not save job.' });
    }
  }

  async function removeJob(jobId: string) {
    const jobToRemove = jobs.find(j => j.id === jobId);
    try {
        await deleteJob(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId));
        toast({
            title: 'Job Removed',
            description: `Job "${jobToRemove?.name}" has been removed.`,
            variant: 'destructive',
        });
    } catch (error) {
        console.error("Firestore Error:", error);
        toast({ variant: 'destructive', title: 'Database Error', description: 'Could not remove job.' });
    }
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
    return jobs.filter(job => job.jobType === jobType).map(job => ({
        ...job,
        status: getJobStatus(job)
    })).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs, jobType]);

  const filteredJobs = useMemo(() => {
    return jobsWithStatus.filter(job => {
        const searchMatch = searchTerm === '' || 
                            job.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.address.toLowerCase().includes(searchTerm.toLowerCase());
        const clientMatch = clientFilter === 'all' || job.clientId === clientFilter;
        return searchMatch && clientMatch;
    });
  }, [jobsWithStatus, searchTerm, clientFilter]);

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
  
  const getServicesString = (services?: { plowing?: boolean, salting?: boolean, sidewalks?: boolean }) => {
    if (!services) return 'N/A';
    const enabledServices = Object.entries(services)
        .filter(([, enabled]) => enabled)
        .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));
    return enabledServices.length > 0 ? enabledServices.join(', ') : 'None';
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
                  {jobType === 'snow_removal' && <TableHead>Services</TableHead>}
                  <TableHead>Client</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
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
                    {jobType === 'snow_removal' && <TableCell className="text-muted-foreground">{getServicesString(job.snowServices)}</TableCell>}
                    <TableCell>{job.clientName}</TableCell>
                    <TableCell>{formatCurrency(job.jobValue)}</TableCell>
                    <TableCell>{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</TableCell>
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

  const MultiSelectDropdown = ({ items, fieldName, title, Icon }: { items: { id: string, name: string }[], fieldName: any, title: string, Icon: React.ElementType }) => {
    const selectedIds = form.watch(fieldName) || [];
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</FormLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : `Select...`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.map(item => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={field.value?.includes(item.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...(field.value || []), item.id])
                        : field.onChange(field.value?.filter((value: string) => value !== item.id))
                    }}
                  >
                    {item.name}
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

  if (isLoading) {
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
                <PageIcon className="h-8 w-8 text-primary" />
                {pageTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                {pageDescription}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAiDialogOpen} onOpenChange={handleAiDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Brain className="mr-2 h-5 w-5" /> Create with AI</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                      <DialogHeader>
                          <DialogTitle>Create {pageTitle} with AI</DialogTitle>
                          <DialogDescription>
                              Describe the job in plain English. The AI will populate the form for you.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                          <Textarea 
                            placeholder={aiPromptExample}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="min-h-[120px]"
                          />
                           {aiError && (
                            <div className="flex items-start gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>{aiError}</p>
                            </div>
                           )}
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
                    {addJobButtonText}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{editingJob ? 'Edit Job' : addJobButtonText}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
                        <Tabs defaultValue={jobType} className="w-full">
                           <TabsContent value={jobType} className="mt-0">
                                <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="jobType"
                                    render={({ field }) => <input type="hidden" {...field} />}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder={jobType === 'snow_removal' ? 'e.g., Downtown Plaza Plowing' : 'e.g., Lot 5 Excavation'} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                    
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <AddressAutocomplete
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="e.g., 123 Main St, Anytown"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem> <FormLabel>Client</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl> <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                                    </div>
                                    <div className="space-y-4">
                                        <FormField control={form.control} name="jobValue" render={({ field }) => ( <FormItem> <FormLabel>Job/Contract Value (Optional)</FormLabel> <FormControl><Input type="number" placeholder="e.g., 25000.00" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                        <FormField control={form.control} name="dateRange" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start & End Date</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}</Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={{ from: field.value?.from, to: field.value?.to }} onSelect={field.onChange} numberOfMonths={2}/></PopoverContent> </Popover> <FormMessage /> </FormItem> )}/>
                                        {watchedJobType === 'concrete' && <FormField control={form.control} name="concreteYards" render={({ field }) => ( <FormItem> <FormLabel>Estimated Concrete (yd³)</FormLabel> <FormControl><Input type="number" placeholder="Calculated or enter manually" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>}
                                    </div>
                                </div>

                                {watchedJobType !== 'snow_removal' ? (
                                    <>
                                        <Separator />
                                        <h3 className="text-lg font-medium">Assign Personnel & Fleet</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <MultiSelectDropdown items={users} fieldName="assignedEmployeeIds" title="Assign Employees" Icon={UsersIcon} />
                                            <MultiSelectDropdown items={trucks} fieldName="assignedTruckIds" title="Assign Trucks" Icon={Truck} />
                                            <MultiSelectDropdown items={trailers} fieldName="assignedTrailerIds" title="Assign Trailers" Icon={Box} />
                                            <MultiSelectDropdown items={heavyEquipments} fieldName="assignedHeavyEquipmentIds" title="Assign Equipment" Icon={Shovel} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Separator />
                                        <h3 className="text-lg font-medium">Services, Hours, & Assignments</h3>
                                         <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                                            <h4 className="font-semibold">Services Provided</h4>
                                            <div className="flex items-center space-x-6">
                                                <FormField control={form.control} name="snowServices.plowing" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Plowing</FormLabel></FormItem>)}/>
                                                <FormField control={form.control} name="snowServices.salting" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Salting</FormLabel></FormItem>)}/>
                                                <FormField control={form.control} name="snowServices.sidewalks" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Sidewalks</FormLabel></FormItem>)}/>
                                            </div>
                                            <Separator />
                                            <h4 className="font-semibold">Business Hours & Special Equipment</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField control={form.control} name="openingTime" render={({ field }) => ( <FormItem> <FormLabel>Opening Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                                <FormField control={form.control} name="closingTime" render={({ field }) => ( <FormItem> <FormLabel>Closing Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                                <FormField control={form.control} name="equipmentNeeds" render={({ field }) => ( <FormItem> <FormLabel>Specific Equipment</FormLabel> <FormControl><Input placeholder="e.g., Skid steer" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                                            </div>
                                            <Separator />
                                            <h4 className="font-semibold">Assign Plowing Crew & Fleet</h4>
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <MultiSelectDropdown items={users} fieldName="assignedEmployeeIds" title="Assign Plow Crew" Icon={UsersIcon} />
                                                <MultiSelectDropdown items={trucks} fieldName="assignedTruckIds" title="Assign Trucks" Icon={Truck} />
                                                <MultiSelectDropdown items={heavyEquipments} fieldName="assignedHeavyEquipmentIds" title="Assign Loaders" Icon={Shovel} />
                                            </div>
                                             <Separator />
                                            <h4 className="font-semibold">Assign Sidewalk Crew</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                 <MultiSelectDropdown items={users} fieldName="assignedSidewalkCrewIds" title="Assign Sidewalk Crew" Icon={UsersIcon} />
                                            </div>
                                         </div>
                                    </>
                                )}
                                </div>
                           </TabsContent>
                        </Tabs>

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
                        <p className="text-xl font-bold text-primary"><AnimatedCounter value={totalActiveValue} type="currency" /></p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Search by name or address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by client..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}
                    </SelectContent>
                </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingJobs.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">{renderJobsTable(activeJobs, "Active Jobs")}</TabsContent>
            <TabsContent value="upcoming" className="mt-4">{renderJobsTable(upcomingJobs, "Upcoming Jobs")}</TabsContent>
            <TabsContent value="completed" className="mt-4">{renderJobsTable(completedJobs, "Completed Jobs")}</TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  );
}
