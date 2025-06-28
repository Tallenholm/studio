
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { loadJobs, saveJobs, loadClients, loadFleetAssets, loadMaintenanceLogs, loadExpenseReports, loadUsers } from '@/lib/localStorageService';
import type { Job, Client, FleetAsset, User, MaintenanceLog, ExpenseReport } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, Briefcase, Building2, Calendar, DollarSign, MapPin, Truck, Box, Shovel, MessageSquare, Send, User as UserIcon, Wrench, Snowflake, Users as UsersIcon, Droplets, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getJobStatus } from '@/lib/job-utils';
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // New state for cost analysis
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (jobId) {
      const allJobs = loadJobs();
      const jobData = allJobs.find(j => j.id === jobId);
      setJob(jobData);
      
      if (jobData) {
        const allClients = loadClients();
        setClient(allClients.find(c => c.id === jobData.clientId));
      }
      
      setAssets(loadFleetAssets());
      setMaintenanceLogs(loadMaintenanceLogs());
      setExpenseReports(loadExpenseReports());
      setAllUsers(loadUsers());
    }
  }, [jobId]);
  
  const jobCosts = useMemo(() => {
    if (!job) return { maintenanceCost: 0, expenseCost: 0, totalCost: 0 };

    const jobInterval = {
      start: parseISO(job.startDate),
      end: parseISO(job.endDate),
    };

    const assignedAssetIds = new Set([
      ...(job.assignedTruckIds || []),
      ...(job.assignedTrailerIds || []),
      ...(job.assignedHeavyEquipmentIds || []),
    ]);

    const maintenanceCost = maintenanceLogs
      .filter(log => {
        const asset = assets.find(a => a.id === log.assetId);
        return asset && assignedAssetIds.has(asset.id) && isWithinInterval(parseISO(log.date), jobInterval);
      })
      .reduce((acc, log) => acc + (log.cost || 0), 0);
      
    // Note: We're assuming expenses are not tied to specific assets for now. 
    // A more complex system might link them. We filter by date.
    const expenseCost = expenseReports
        .filter(report => isWithinInterval(parseISO(report.date), jobInterval))
        .reduce((acc, report) => acc + report.amount, 0);

    return {
      maintenanceCost,
      expenseCost,
      totalCost: maintenanceCost + expenseCost
    };
  }, [job, assets, maintenanceLogs, expenseReports]);


  const handleAddNote = () => {
    if (!job || !user || !newNote.trim()) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot add an empty note.'
        });
        return;
    }

    const note = {
      timestamp: new Date().toISOString(),
      content: newNote,
      author: user.name,
    };

    const updatedJob = {
      ...job,
      notes: [...(job.notes || []), note],
    };

    const allJobs = loadJobs();
    const updatedJobs = allJobs.map(j => (j.id === jobId ? updatedJob : j));
    saveJobs(updatedJobs);
    setJob(updatedJob);
    setNewNote('');
    toast({ title: 'Note Added', description: 'Your note has been added to the job log.' });
  };
  
  if (!isMounted || job === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Job Details...</p>
      </div>
    );
  }

  if (job === null) {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center bg-card/90 backdrop-blur-xl border-destructive/50">
        <CardHeader>
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Job Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            The job you are looking for does not exist or could not be loaded.
          </p>
          <Link href="/admin/manage-jobs">
            <Button variant="outline">Back to Jobs List</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const jobStatus = getJobStatus(job);
  
  const JobIcon = (() => {
      switch(job.jobType) {
          case 'excavation': return Briefcase;
          case 'snow_removal': return Snowflake;
          case 'concrete': return Droplets;
          case 'misc': return Package;
          default: return Briefcase;
      }
  })();
  
  const getJobTypeName = () => {
      switch(job.jobType) {
          case 'excavation': return 'job';
          case 'snow_removal': return 'snow contract';
          case 'concrete': return 'concrete job';
          case 'misc': return 'misc. job';
          default: return 'job';
      }
  }

  const assignedEmployees = allUsers.filter(u => job?.assignedEmployeeIds?.includes(u.id));
  const assignedTrucks = assets.filter(a => job?.assignedTruckIds?.includes(a.id));
  const assignedTrailers = assets.filter(a => job?.assignedTrailerIds?.includes(a.id));
  const assignedHeavyEquipment = assets.filter(a => job?.assignedHeavyEquipmentIds?.includes(a.id));
  const assignedSidewalkCrew = allUsers.filter(u => job?.assignedSidewalkCrewIds?.includes(u.id));

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  
  const estimatedProfit = (job.jobValue || 0) - jobCosts.totalCost;

  const renderAssetList = (assetList: (FleetAsset | User)[], title: string, Icon: React.ElementType) => (
    <div>
        <h4 className="font-semibold text-md mb-2 flex items-center gap-2"><Icon className="h-5 w-5 text-primary"/>{title}</h4>
        {assetList.length > 0 ? (
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {assetList.map(asset => <li key={asset.id}>{asset.name}</li>)}
            </ul>
        ) : (
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} assigned.</p>
        )}
    </div>
  );

  const getServicesString = (services?: { plowing?: boolean, salting?: boolean, sidewalks?: boolean }) => {
    if (!services) return 'N/A';
    const enabledServices = Object.entries(services)
        .filter(([, enabled]) => enabled)
        .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));
    return enabledServices.length > 0 ? enabledServices.join(', ') : 'None';
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <JobIcon className="h-8 w-8 text-primary" />
                {job.name}
              </CardTitle>
              <CardDescription className="mt-2 capitalize">
                Detailed view of this {getJobTypeName()}, including its assignments, costs, and activity log.
              </CardDescription>
            </div>
             <Badge variant={jobStatus === 'active' ? 'default' : jobStatus === 'completed' ? 'secondary' : 'outline'} className={cn(jobStatus === 'active' && 'bg-green-600', 'text-lg')}>
                {jobStatus}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Job Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-primary mt-1" />
                        <div>
                            <p className="text-muted-foreground">Client</p>
                            <p className="font-semibold">{client?.name || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-1" />
                        <div>
                            <p className="text-muted-foreground">Address</p>
                            <p className="font-semibold">{job.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary mt-1" />
                        <div>
                            <p className="text-muted-foreground">Dates</p>
                            <p className="font-semibold">{format(new Date(job.startDate), 'PPP')} - {format(new Date(job.endDate), 'PPP')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-primary mt-1" />
                        <div>
                            <p className="text-muted-foreground">{job.jobType === 'snow_removal' ? 'Contract Value' : 'Job Value'}</p>
                            <p className="font-semibold">{formatCurrency(job.jobValue)}</p>
                        </div>
                    </div>
                     {job.jobType === 'snow_removal' && (
                        <div className="flex items-start gap-3">
                            <Snowflake className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <p className="text-muted-foreground">Services</p>
                                <p className="font-semibold">{getServicesString(job.snowServices)}</p>
                            </div>
                        </div>
                    )}
                    {job.jobType === 'concrete' && job.concreteYards && (
                        <div className="flex items-start gap-3">
                            <Droplets className="h-5 w-5 text-primary mt-1" />
                            <div>
                                <p className="text-muted-foreground">Estimated Concrete</p>
                                <p className="font-semibold">{job.concreteYards} yd³</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Job Cost Analysis</CardTitle>
                    <CardDescription>Estimated operational costs and profitability for the job's date range.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Maintenance Cost</p>
                        <p className="text-2xl font-bold">-<AnimatedCounter value={jobCosts.maintenanceCost} type="currency" /></p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Expense Cost</p>
                        <p className="text-2xl font-bold">-<AnimatedCounter value={jobCosts.expenseCost} type="currency" /></p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Total Costs</p>
                        <p className="text-2xl font-bold text-destructive">-<AnimatedCounter value={jobCosts.totalCost} type="currency" /></p>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{background: estimatedProfit >= 0 ? 'hsla(var(--primary) / 0.1)' : 'hsla(var(--destructive) / 0.1)'}}>
                        <p className="text-sm" style={{color: estimatedProfit >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}}>Est. Profit / Loss</p>
                        <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", estimatedProfit >= 0 ? 'text-primary' : 'text-destructive' )}>
                           {estimatedProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                           <AnimatedCounter value={Math.abs(estimatedProfit)} type="currency" />
                        </p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">{job.jobType === 'snow_removal' ? 'Routing & Assignments' : 'Assigned Personnel & Fleet'}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {job.jobType === 'snow_removal' ? (
                        <>
                           {renderAssetList([...assignedTrucks, ...assignedHeavyEquipment], 'Plow & Salt Fleet', Truck)}
                           {renderAssetList(assignedSidewalkCrew, 'Sidewalk Crew', UsersIcon)}
                        </>
                    ) : (
                        <>
                           {renderAssetList(assignedEmployees, 'Personnel', UsersIcon)}
                           {renderAssetList(assignedTrucks, 'Trucks', Truck)}
                           {renderAssetList(assignedTrailers, 'Trailers', Box)}
                           {renderAssetList(assignedHeavyEquipment, 'Heavy Equipment', Shovel)}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Job Log
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {job.notes && job.notes.length > 0 ? (
                            [...job.notes].reverse().map((note, index) => (
                                <div key={index} className="flex gap-3">
                                    <UserIcon className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-sm">{note.author}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(note.timestamp), 'MMM d, h:mm a')}</p>
                                        </div>
                                        <p className="text-sm text-foreground/80">{note.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No notes have been added for this job yet.</p>
                        )}
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                        <Textarea 
                            placeholder="Add a new note..." 
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                        />
                        <Button onClick={handleAddNote} className="w-full">
                            <Send />
                            Add Note
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
