

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getJobById, addNoteToJob, getClientById, getAssetsByIds, getUsersByIds } from '@/lib/firestoreService';
import type { Job, Client, FleetAsset, User, SnowServiceLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/provider';
import { Loader2, AlertTriangle, Briefcase, Building2, Calendar, DollarSign, MapPin, Truck, Box, Shovel, MessageSquare, Send, User as UserIcon, Snowflake, Users as UsersIcon, Droplets, Package, TrendingUp, TrendingDown, Eye, Camera, History, Wrench } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getJobStatus } from '@/lib/job-utils';
import { cn } from '@/lib/utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getJobCost } from '@/app/actions/getJobCost';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { toast } = useToast();
  const { user } = useUser();

  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [assignedAssets, setAssignedAssets] = useState<FleetAsset[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [newNote, setNewNote] = useState('');

  // New state for cost analysis
  const [jobCosts, setJobCosts] = useState({ maintenanceCost: 0, expenseCost: 0, laborCost: 0, totalCost: 0, estimatedProfit: 0 });
  const [isLoadingCosts, setIsLoadingCosts] = useState(true);

  useEffect(() => {
    if (jobId) {
      const fetchJob = async () => {
        try {
          const jobData = await getJobById(jobId);
          setJob(jobData);
        } catch (error) {
          console.error("Error fetching job:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load job data.' });
          setJob(null);
        }
      };
      fetchJob();
    }
  }, [jobId, toast]);

  useEffect(() => {
    if (job) {
      const fetchRelatedData = async () => {
        try {
          const allAssetIds = [
            ...(job.assignedTruckIds || []),
            ...(job.assignedTrailerIds || []),
            ...(job.assignedHeavyEquipmentIds || []),
          ];

          const allUserIds = [
            ...(job.assignedEmployeeIds || []),
            ...(job.assignedSidewalkCrewIds || []),
          ];

          const uniqueUserIds = [...new Set(allUserIds)];
          const uniqueAssetIds = [...new Set(allAssetIds)];

          const [clientData, assetsData, usersData] = await Promise.all([
            job.clientId ? getClientById(job.clientId) : Promise.resolve(null),
            uniqueAssetIds.length > 0 ? getAssetsByIds(uniqueAssetIds) : Promise.resolve([]),
            uniqueUserIds.length > 0 ? getUsersByIds(uniqueUserIds) : Promise.resolve([]),
          ]);

          setClient(clientData);
          setAssignedAssets(assetsData);
          setAssignedUsers(usersData);

        } catch (error) {
          console.error("Error fetching related job details:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load related assets and personnel.' });
        }
      };
      fetchRelatedData();
    }
  }, [job, toast]);

  // useEffect to fetch costs from server action
  useEffect(() => {
    if (job) {
      setIsLoadingCosts(true);
      getJobCost(job)
        .then(costs => {
          setJobCosts(costs);
        })
        .catch(error => {
          console.error("Failed to calculate job costs:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not calculate job costs.' });
        })
        .finally(() => {
          setIsLoadingCosts(false);
        });
    }
  }, [job, toast]);

  const handleAddNote = async () => {
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

    try {
      await addNoteToJob(job.id, note);
      const updatedJob = { ...job, notes: [...(job.notes || []), note] };
      setJob(updatedJob);
      setNewNote('');
      toast({ title: 'Note Added', description: 'Your note has been added to the job log.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'Could not add note.' });
    }
  };

  if (job === undefined) {
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
    switch (job.jobType) {
      case 'excavation': return Briefcase;
      case 'snow_removal': return Snowflake;
      case 'concrete': return Droplets;
      case 'misc': return Package;
      default: return Briefcase;
    }
  })();

  const getJobTypeName = () => {
    switch (job.jobType) {
      case 'excavation': return 'job';
      case 'snow_removal': return 'snow contract';
      case 'concrete': return 'concrete job';
      case 'misc': return 'misc. job';
      default: return 'job';
    }
  }

  const assignedEmployees = assignedUsers.filter(u => job?.assignedEmployeeIds?.includes(u.id));
  const assignedTrucks = assignedAssets.filter(a => job?.assignedTruckIds?.includes(a.id));
  const assignedTrailers = assignedAssets.filter(a => job?.assignedTrailerIds?.includes(a.id));
  const assignedHeavyEquipment = assignedAssets.filter(a => job?.assignedHeavyEquipmentIds?.includes(a.id));

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  const renderAssetList = (assetList: (FleetAsset | User)[], title: string, Icon: React.ElementType) => (
    <div>
      <h4 className="font-semibold text-md mb-2 flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{title}</h4>
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

  const renderSnowLog = (logs: SnowServiceLog[], title: string) => (
    <div className="space-y-2">
      <h4 className="font-semibold text-md">{title} ({logs.length})</h4>
      {logs.length > 0 ? (
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, index) => (
            <div key={index} className="flex gap-3 p-2 border rounded-md bg-background">
              {log.photoDataUri && (
                <a href={log.photoDataUri} target="_blank" rel="noopener noreferrer">
                  <Image src={log.photoDataUri} alt="Verification" width={48} height={48} className="rounded-md object-cover" />
                </a>
              )}
              <div className="text-xs">
                <p><strong>By:</strong> {log.employeeName}</p>
                <p><strong>At:</strong> {format(parseISO(log.timestamp), 'PPpp')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} logs yet.</p>
      )}
    </div>
  );

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
                  <p className="font-semibold">{format(parseISO(job.startDate), 'PPP')} - {format(parseISO(job.endDate), 'PPP')}</p>
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

          <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-8">
            <Card>
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="p-6 hover:no-underline">
                  <CardTitle className="text-xl">Job Cost Analysis</CardTitle>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <CardDescription className="mb-4">Estimated operational costs and profitability for the job's date range.</CardDescription>
                  {isLoadingCosts ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-4 text-muted-foreground">Calculating costs...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><UsersIcon className="h-4 w-4" />Labor Cost</p>
                        <p className="text-2xl font-bold">-<AnimatedCounter value={jobCosts.laborCost} type="currency" /></p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Wrench className="h-4 w-4" />Maintenance</p>
                        <p className="text-2xl font-bold">-<AnimatedCounter value={jobCosts.maintenanceCost} type="currency" /></p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><DollarSign className="h-4 w-4" />Expenses</p>
                        <p className="text-2xl font-bold">-<AnimatedCounter value={jobCosts.expenseCost} type="currency" /></p>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ background: jobCosts.estimatedProfit >= 0 ? 'hsla(var(--primary) / 0.1)' : 'hsla(var(--destructive) / 0.1)' }}>
                        <p className="text-sm" style={{ color: jobCosts.estimatedProfit >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>Est. Profit / Loss</p>
                        <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", jobCosts.estimatedProfit >= 0 ? 'text-primary' : 'text-destructive')}>
                          {jobCosts.estimatedProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                          <AnimatedCounter value={Math.abs(jobCosts.estimatedProfit)} type="currency" />
                        </p>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Card>

            {job.jobType === 'snow_removal' ? (
              <Card>
                <AccordionItem value="item-2" className="border-b-0">
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle className="text-xl flex items-center gap-2"><History className="h-5 w-5" />Snow Service Log</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <CardDescription className="mb-4">A complete history of all services performed for this contract.</CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {renderSnowLog(job.snowLog?.plowing || [], "Plowing")}
                      {renderSnowLog(job.snowLog?.salting || [], "Salting")}
                      {renderSnowLog(job.snowLog?.sidewalks || [], "Sidewalks")}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ) : (
              <Card>
                <AccordionItem value="item-3" className="border-b-0">
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle className="text-xl">Assigned Personnel &amp; Fleet</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {renderAssetList(assignedEmployees, 'Personnel', UsersIcon)}
                      {renderAssetList(assignedTrucks, 'Trucks', Truck)}
                      {renderAssetList(assignedTrailers, 'Trailers', Box)}
                      {renderAssetList(assignedHeavyEquipment, 'Heavy Equipment', Shovel)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )}
          </Accordion>
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
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(note.timestamp), { addSuffix: true })}</p>
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
