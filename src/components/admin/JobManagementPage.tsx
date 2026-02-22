
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getJobs, addJob, updateJob, deleteJob, getClients, getFleetAssets, getUsers } from '@/lib/firestoreService';
import type { Client, Job, JobStatus, FleetAsset, User, JobType } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Pencil, Filter, MoreHorizontal, Eye, Brain, AlertCircle, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getJobStatus } from '@/lib/job-utils';
import { createJobFromPrompt } from '@/ai/flows/create-job-from-prompt';
import type { CreateJobFromPromptOutput } from '@/ai/flows/create-job-from-prompt-schema';
import { Textarea } from '@/components/ui/textarea';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobFormFields from '@/components/admin/JobFormFields';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export const jobSchema = z.object({
  name: z.string().min(1, 'Job name is required.'),
  clientId: z.string({ required_error: 'Please select a client.' }),
  address: z.string().min(1, 'Job address is required.'),
  jobValue: z.coerce.number().optional(),
  jobType: z.enum(['excavation', 'utilities', 'concrete', 'landscaping', 'snow_removal', 'misc']),
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


export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingJob, setIsGeneratingJob] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');

  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: 'excavation',
      assignedEmployeeIds: [],
      assignedTruckIds: [],
      assignedTrailerIds: [],
      assignedHeavyEquipmentIds: [],
      assignedSidewalkCrewIds: [],
      snowServices: { plowing: false, salting: false, sidewalks: false },
    },
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [loadedClients, loadedUsers, loadedFleetAssets, loadedJobs] = await Promise.all([
          getClients(),
          getUsers(),
          getFleetAssets(),
          getJobs(),
        ]);
        setClients(loadedClients);
        setUsers(loadedUsers);
        setFleetAssets(loadedFleetAssets);
        setJobs(loadedJobs);
      } catch (error) {
        console.error("Failed to fetch page data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load page data.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const employeeUsers = useMemo(() => users.filter(u => u.role === 'employee'), [users]);


  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({
        name: '', address: '', jobType: 'excavation',
        assignedEmployeeIds: [], assignedTruckIds: [], assignedTrailerIds: [], assignedHeavyEquipmentIds: [], assignedSidewalkCrewIds: [],
        snowServices: { plowing: false, salting: false, sidewalks: false },
        concreteYards: undefined, jobValue: undefined,
      });
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
      jobType: job.jobType,
      dateRange: {
        from: new Date(job.startDate),
        to: new Date(job.endDate),
      },
      assignedEmployeeIds: job.assignedEmployeeIds || [],
      assignedTruckIds: job.assignedTruckIds || [],
      assignedTrailerIds: job.assignedTrailerIds || [],
      assignedHeavyEquipmentIds: job.assignedHeavyEquipmentIds || [],
      assignedSidewalkCrewIds: job.assignedSidewalkCrewIds || [],
      snowServices: job.snowServices || { plowing: false, salting: false, sidewalks: false },
      concreteYards: job.concreteYards,
      openingTime: job.openingTime,
      closingTime: job.closingTime,
      equipmentNeeds: job.equipmentNeeds,
    });
    setIsDialogOpen(true);
  };

  const handleAiDialogOpenChange = (open: boolean) => {
    setIsAiDialogOpen(open);
    if (!open) {
      setAiPrompt('');
      setAiError(null);
      setIsGeneratingJob(false);
    }
  }

  async function handleGenerateJob() {
    if (!aiPrompt.trim()) {
      setAiError('Prompt cannot be empty.');
      return;
    }
    setIsGeneratingJob(true);
    setAiError(null);
    try {
      const result: CreateJobFromPromptOutput = await createJobFromPrompt(aiPrompt);

      const client = clients.find(c => c.name.toLowerCase() === result.clientName.toLowerCase());
      if (!client && result.clientName) {
        setAiError(`Client "${result.clientName}" not found. Please add them on the "Manage Clients" page first.`);
        setIsGeneratingJob(false);
        return;
      }

      form.reset({
        name: result.name,
        clientId: client?.id,
        address: result.address,
        jobValue: result.jobValue,
        jobType: result.jobType,
        concreteYards: result.concreteYards,
        dateRange: {
          from: new Date(result.startDate),
          to: new Date(result.endDate),
        },
      });

      toast({ title: 'AI Prefill Complete', description: 'Job form has been populated. Please review and save.' });
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
        setJobs(prev => [...prev, { id: newId, ...newJob }]);
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
      const typeMatch = typeFilter === 'all' || job.jobType === typeFilter;
      return searchMatch && clientMatch && typeMatch;
    });
  }, [jobsWithStatus, searchTerm, clientFilter, typeFilter]);

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

  const renderJobsTable = (jobList: (Job & { status: JobStatus })[]) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Job Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="text-right w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobList.length > 0 ? jobList.map(job => (
            <TableRow key={job.id}>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(job.status)}>{job.status}</Badge>
              </TableCell>
              <TableCell className="font-medium">{job.name}</TableCell>
              <TableCell>{job.clientName}</TableCell>
              <TableCell>{formatCurrency(job.jobValue)}</TableCell>
              <TableCell>{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href={`/admin/jobs/${job.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link></DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleEditClick(job)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setJobToDelete(job)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">No jobs found with current filters.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <>
    <div className="container mx-auto py-8">
      <PageHeader
        title="Manage Jobs"
        description="Create, assign, and track all company jobs and contracts from a single, unified interface."
        icon={Briefcase}
      >
        <div className="flex gap-2">
          <Dialog open={isAiDialogOpen} onOpenChange={handleAiDialogOpenChange}>
            <DialogTrigger asChild><Button variant="outline"><Brain className="mr-2 h-5 w-5" /> Create with AI</Button></DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader><DialogTitle>Create Job with AI</DialogTitle><DialogDescription>Describe the job in plain English. The AI will populate the form for you.</DialogDescription></DialogHeader>
              <div className="py-4 space-y-4">
                <Textarea placeholder="e.g., Excavate the foundation for Main Street Properties at 456 Central Ave. Start tomorrow and finish in two weeks. The job is worth $75,000." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="min-h-[120px]" />
                {aiError && (<div className="flex items-start gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/50 rounded-md"><AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><p>{aiError}</p></div>)}
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateJob} disabled={isGeneratingJob}>
                  {isGeneratingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                  {isGeneratingJob ? 'Generating...' : 'Generate Job'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-5 w-5" /> Add New Job</Button></DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader><DialogTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
                  <JobFormFields form={form} clients={clients} fleetAssets={fleetAssets} users={employeeUsers} />
                  <DialogFooter><Button type="submit">Save Job</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <div className="mt-8 animate-fade-in-up space-y-6">
        {jobs.length > 0 ? (
          <>
            <Card className="bg-muted/30">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5" />Filters</CardTitle>
                <div className="flex items-center gap-2"><p className="text-sm text-muted-foreground">Total Active Value:</p><p className="text-xl font-bold text-primary"><AnimatedCounter value={totalActiveValue} type="currency" /></p></div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Search by name or address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by client..." /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Clients</SelectItem>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Tabs defaultValue="active" className="w-full" onValueChange={(value) => setTypeFilter(value as JobType | 'all')}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">{renderJobsTable(filteredJobs)}</TabsContent>
              <TabsContent value="active" className="mt-4">{renderJobsTable(activeJobs)}</TabsContent>
              <TabsContent value="upcoming" className="mt-4">{renderJobsTable(upcomingJobs)}</TabsContent>
              <TabsContent value="completed" className="mt-4">{renderJobsTable(completedJobs)}</TabsContent>
            </Tabs>
          </>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No Jobs Found"
            message="Get started by creating a new job manually or using AI."
            actionLabel="Create with AI"
            onAction={() => setIsAiDialogOpen(true)}
          />
        )}
      </div>
    </div>
     <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job
              <span className="font-bold"> {jobToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (jobToDelete) {
                  removeJob(jobToDelete.id);
                }
              }}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
