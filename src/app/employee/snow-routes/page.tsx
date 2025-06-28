'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadJobs, saveJobs, loadSnowRoutes, loadUsers, loadFleetAssets } from '@/lib/localStorageService';
import type { Job, User, FleetAsset, SnowRoute } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Snowflake, CheckCircle2, MapPin, Building2, Truck, Users as UsersIcon, Printer } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function SnowRoutesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [routes, setRoutes] = useState<SnowRoute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setIsMounted(true);
      setJobs(loadJobs());
      setRoutes(loadSnowRoutes());
      setUsers(loadUsers());
      setFleetAssets(loadFleetAssets());
    }
  }, [user]);

  const assignedRoutes = useMemo(() => {
    if (!user) return [];
    return routes
      .filter(route => route.assignedEmployeeIds?.includes(user.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [routes, user]);

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
                className="w-full print-hidden"
            >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {label}
            </Button>
            {lastCompleted && (
                 <p className="text-xs text-muted-foreground print-hidden">
                    Done {formatDistanceToNow(parseISO(lastCompleted), { addSuffix: true })}
                </p>
            )}
        </div>
    );
  };
  
  const ServiceStatus = ({ job, service, label }: { job: Job; service: 'plowing' | 'salting' | 'sidewalks'; label: string }) => {
    const statusKey = service === 'plowing' ? 'lastPlowed' : service === 'salting' ? 'lastSalted' : 'lastSidewalks';
    const lastCompleted = job.snowStatus?.[statusKey];
    
    return (
      <li className="flex justify-between items-center text-sm">
        <span>{label}:</span>
        {lastCompleted ? (
          <span className="font-medium">Completed {formatDistanceToNow(parseISO(lastCompleted), { addSuffix: true })}</span>
        ) : (
          <span className="font-semibold text-destructive">PENDING</span>
        )}
      </li>
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
      <div className="hidden print-block text-center mb-8">
        <h1 className="text-2xl font-bold">Logan's Excavating - Snow Route Report</h1>
        <p>Generated on: {format(new Date(), 'PPP p')}</p>
        <p>For Employee: {user.name}</p>
      </div>
      <div className="flex justify-between items-start mb-12 flex-wrap gap-4 print-hidden">
        <div className="text-center md:text-left">
          <Snowflake className="h-16 w-16 text-primary mx-auto md:mx-0 mb-4" />
          <h1 className="text-4xl font-headline font-bold">My Snow Routes</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Your assigned routes and contracts for the current snow event.
          </p>
        </div>
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-5 w-5" />
          Generate Report
        </Button>
      </div>

      {assignedRoutes.length > 0 ? (
        <div className="space-y-8">
          {assignedRoutes.map(route => {
             const routeCrew = users.filter(u => route.assignedEmployeeIds?.includes(u.id));
             const routeFleet = fleetAssets.filter(a => route.assignedVehicleIds?.includes(a.id));

            return (
            <Card key={route.id} className="printable-card bg-card/90 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline capitalize">{route.name}</CardTitle>
                    <CardDescription>Type: <span className="capitalize font-medium">{route.type}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-primary" />
                            <strong>Crew:</strong>
                            <span className="text-muted-foreground">{routeCrew.map(c => c.name).join(', ') || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <strong>Fleet:</strong>
                            <span className="text-muted-foreground">{routeFleet.map(f => f.name).join(', ') || 'N/A'}</span>
                        </div>
                   </div>
                    {route.assignedJobIds?.map(jobId => {
                        const job = jobs.find(j => j.id === jobId);
                        if (!job) return null;
                        
                        return (
                             <Card key={job.id} className="bg-muted/30">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                                <Building2 className="h-5 w-5"/>
                                                {job.clientName}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <MapPin className="h-4 w-4"/>
                                                {job.address}
                                            </CardDescription>
                                        </div>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer" className="print-hidden">
                                            <Button size="sm" variant="outline"><MapPin /> Get Directions</Button>
                                        </a>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Separator />
                                    <h4 className="font-semibold print-hidden">Services Required:</h4>
                                    
                                    {/* Interactive buttons for screen */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-hidden">
                                        {job.snowServices?.plowing && route.type === 'plowing' && <ServiceButton job={job} service="plowing" label="Plowed Lot" />}
                                        {job.snowServices?.salting && route.type === 'salting' && <ServiceButton job={job} service="salting" label="Salted Lot" />}
                                        {job.snowServices?.sidewalks && route.type === 'sidewalks' && <ServiceButton job={job} service="sidewalks" label="Did Sidewalks" />}
                                    </div>

                                    {/* Simple status list for print */}
                                    <div className="hidden print-block space-y-1">
                                        <h5 className="font-semibold mb-2">Service Status:</h5>
                                        <ul className="space-y-1">
                                            {job.snowServices?.plowing && route.type === 'plowing' && <ServiceStatus job={job} service="plowing" label="Plowing" />}
                                            {job.snowServices?.salting && route.type === 'salting' && <ServiceStatus job={job} service="salting" label="Salting" />}
                                            {job.snowServices?.sidewalks && route.type === 'sidewalks' && <ServiceStatus job={job} service="sidewalks" label="Sidewalks" />}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
          )})}
        </div>
      ) : (
        <Card className="text-center py-12 print-hidden">
            <CardHeader>
                <Snowflake className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl font-headline">No Active Snow Routes</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-lg">
                There are currently no active snow routes assigned to you. Check back later!
                </CardDescription>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
