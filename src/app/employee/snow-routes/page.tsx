
'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadJobs, saveJobs, loadUsers, loadFleetAssets } from '@/lib/localStorageService';
import type { Job, User, FleetAsset } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Snowflake, CheckCircle2, MapPin, Building2, Truck, Users as UsersIcon } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { getJobStatus } from '@/lib/job-utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function SnowRoutesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setIsMounted(true);
      const allJobs = loadJobs();
      setJobs(allJobs);
    }
  }, [user]);

  const activeSnowContracts = useMemo(() => {
    if (!user) return [];
    return jobs
      .filter(job => 
        job.jobType === 'snow_removal' &&
        getJobStatus(job) === 'active' &&
        (job.assignedPlowDriverIds?.includes(user.id) || job.assignedSidewalkCrewIds?.includes(user.id))
      )
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [jobs, user]);

  const handleServiceComplete = (jobId: string, service: 'plowing' | 'salting' | 'sidewalks') => {
    if (!user) return;
    
    let updatedJobs = [...jobs];
    const jobIndex = updatedJobs.findIndex(j => j.id === jobId);
    
    if (jobIndex > -1) {
      const jobToUpdate = { ...updatedJobs[jobIndex] };
      const now = new Date().toISOString();
      const statusKey = service === 'plowing' ? 'lastPlowed' : service === 'salting' ? 'lastSalted' : 'lastSidewalks';
      
      jobToUpdate.snowStatus = {
        ...jobToUpdate.snowStatus,
        [statusKey]: now,
      };

      updatedJobs[jobIndex] = jobToUpdate;
      setJobs(updatedJobs);
      saveJobs(updatedJobs);

      toast({
        title: 'Service Logged',
        description: `${service.charAt(0).toUpperCase() + service.slice(1)} at ${jobToUpdate.clientName} marked as complete.`,
      });
    }
  };

  const ServiceButton = ({ job, service, label }: { job: Job; service: 'plowing' | 'salting' | 'sidewalks'; label: string }) => {
    const statusKey = service === 'plowing' ? 'lastPlowed' : service === 'salting' ? 'lastSalted' : 'lastSidewalks';
    const lastCompleted = job.snowStatus?.[statusKey];
    
    return (
        <div className="flex flex-col items-center gap-2">
             <Button 
                onClick={() => handleServiceComplete(job.id, service)}
                variant={lastCompleted ? "secondary" : "default"}
                className="w-full"
            >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {label}
            </Button>
            {lastCompleted && (
                 <p className="text-xs text-muted-foreground">
                    Done {formatDistanceToNow(parseISO(lastCompleted), { addSuffix: true })}
                </p>
            )}
        </div>
    );
  };

  if (!isMounted || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Your Snow Routes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <Snowflake className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Active Snow Routes</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your list of active properties. Mark services as complete in real-time.
        </p>
      </div>

      {activeSnowContracts.length > 0 ? (
        <div className="space-y-6">
          {activeSnowContracts.map(job => (
            <Card key={job.id} className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-headline flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-primary"/>
                            {job.clientName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4"/>
                            {job.address}
                        </CardDescription>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><MapPin /> Get Directions</Button>
                    </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <h4 className="font-semibold text-lg">Services Required</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {job.snowServices?.plowing && <ServiceButton job={job} service="plowing" label="Plowed Lot" />}
                    {job.snowServices?.salting && <ServiceButton job={job} service="salting" label="Salted Lot" />}
                    {job.snowServices?.sidewalks && <ServiceButton job={job} service="sidewalks" label="Did Sidewalks" />}
                </div>
                 <div className="pt-2">
                    {job.assignedPlowDriverIds?.includes(user.id) && (
                        <Badge variant="outline" className="text-primary border-primary">
                            <Truck className="mr-1.5 h-3 w-3" />
                            You are assigned to the Plow Crew
                        </Badge>
                    )}
                     {job.assignedSidewalkCrewIds?.includes(user.id) && (
                        <Badge variant="outline" className="text-primary border-primary ml-2">
                            <UsersIcon className="mr-1.5 h-3 w-3" />
                            You are assigned to the Sidewalk Crew
                        </Badge>
                    )}
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
            <CardHeader>
                <Snowflake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl font-headline">No Active Snow Routes</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-lg">
                There are currently no active snow contracts assigned to you. Check back later!
                </CardDescription>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
