
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { getJobs, updateJob, getUsers, getFleetAssets } from '@/lib/firestoreService';
import type { Job, User, FleetAsset, SnowRoute, SnowServiceLog } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Snowflake, CheckCircle2, MapPin, Building2, Truck, Users as UsersIcon, Printer, History, PlusCircle, Camera, FileUp, Eye, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { optimizeSnowRoute } from '@/ai/flows/optimize-snow-route-flow';
import type { OptimizeSnowRouteOutput } from '@/ai/flows/optimize-snow-route-flow';
import { arrayUnion, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const logSchema = z.object({
  photoDataUri: z.string().optional(),
});

type ServiceType = 'plowing' | 'salting' | 'sidewalks';

export default function SnowRoutesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [routes, setRoutes] = useState<SnowRoute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // State for modals/dialogs
  const [logServiceInfo, setLogServiceInfo] = useState<{ job: Job; service: ServiceType } | null>(null);
  const [historyInfo, setHistoryInfo] = useState<{ job: Job; service: ServiceType } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [optimizingRouteId, setOptimizingRouteId] = useState<string | null>(null);
  const [optimizedRoutePlan, setOptimizedRoutePlan] = useState<OptimizeSnowRouteOutput | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: { photoDataUri: '' },
  });

  useEffect(() => {
    if (!user || !db) return;
    setIsLoading(true);

    const fetchData = async () => {
        const [loadedJobs, loadedUsers, loadedAssets] = await Promise.all([
            getJobs(),
            getUsers(),
            getFleetAssets()
        ]);
        setJobs(loadedJobs.filter(j => j.jobType === 'snow_removal'));
        setUsers(loadedUsers);
        setFleetAssets(loadedAssets);
    };

    fetchData().then(() => setIsLoading(false));

    const q = query(collection(db, 'snowRoutes'), where('assignedEmployeeIds', 'array-contains', user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveRoutes: SnowRoute[] = [];
        snapshot.forEach((doc) => {
            liveRoutes.push({ id: doc.id, ...doc.data() } as SnowRoute);
        });
        setRoutes(liveRoutes.sort((a,b) => a.name.localeCompare(b.name)));
    }, (error) => {
        console.error("Error fetching real-time routes:", error);
        toast({ variant: "destructive", title: "Real-time Error", description: "Could not fetch live route updates." });
    });

    return () => unsubscribe();
  }, [user, toast]);

  // Camera stream cleanup
  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('photoDataUri', reader.result as string);
        form.clearErrors('photoDataUri');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCamera = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(newStream);
        setIsCameraOpen(true);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera. Please check permissions.' });
    }
  };

  useEffect(() => {
    if(isCameraOpen && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream])

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    form.setValue('photoDataUri', canvas.toDataURL('image/jpeg'));
    form.clearErrors('photoDataUri');
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  };


  const onLogSubmit = async (values: z.infer<typeof logSchema>) => {
    if (!user || !logServiceInfo) return;

    const newLog: SnowServiceLog = {
      timestamp: new Date().toISOString(),
      employeeId: user.id,
      employeeName: user.name,
      photoDataUri: values.photoDataUri,
    };
    
    const logPath = `snowLog.${logServiceInfo.service}`;

    await updateJob(logServiceInfo.job.id, {
        [logPath]: arrayUnion(newLog)
    });
    
    const updatedJobs = jobs.map(j => {
      if (j.id === logServiceInfo.job.id) {
        const updatedJob = { ...j };
        if (!updatedJob.snowLog) {
            updatedJob.snowLog = { plowing: [], salting: [], sidewalks: [] };
        }
        updatedJob.snowLog[logServiceInfo.service].push(newLog);
        return updatedJob;
      }
      return j;
    });
    setJobs(updatedJobs);

    toast({ title: 'Service Logged', description: `${logServiceInfo.service} at ${logServiceInfo.job.clientName} has been recorded.` });
    setLogServiceInfo(null);
    form.reset();
  };

  const getMostRecentLog = (job: Job, service: ServiceType): SnowServiceLog | undefined => {
    const logs = job.snowLog?.[service] || [];
    if (logs.length === 0) return undefined;
    return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }
  
  const handleOptimizeRoute = async (route: SnowRoute) => {
    setOptimizingRouteId(route.id);
    const routeJobs = (route.assignedJobIds || [])
      .map(id => jobs.find(j => j.id === id))
      .filter((j): j is Job => !!j);
      
    if (routeJobs.length < 2) {
        toast({variant: 'destructive', title: 'Not Enough Jobs', description: 'At least two jobs are required to optimize a route.'});
        setOptimizingRouteId(null);
        return;
    }
    
    const flowInput = {
        jobs: routeJobs.map(j => ({
            id: j.id,
            name: j.name,
            address: j.address,
            openingTime: j.openingTime,
            closingTime: j.closingTime,
            equipmentNeeds: j.equipmentNeeds
        }))
    };

    try {
        const plan = await optimizeSnowRoute(flowInput);
        setOptimizedRoutePlan(plan);
    } catch (error) {
        console.error("Route optimization error:", error);
        toast({ variant: 'destructive', title: 'Optimization Failed', description: 'Could not generate an optimized route at this time.' });
    } finally {
        setOptimizingRouteId(null);
    }
  };

  const openRouteInMaps = () => {
    if (!optimizedRoutePlan || optimizedRoutePlan.optimizedJobs.length === 0) return;

    const addresses = optimizedRoutePlan.optimizedJobs.map(j => encodeURIComponent(j.address));
    
    if (addresses.length === 1) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}`, '_blank');
        return;
    }
    
    const origin = addresses[0];
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(1, -1).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Your Snow Routes...</p>
      </div>
    );
  }

  return (
    <>
    <canvas ref={canvasRef} className="hidden" />

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
            Your assigned routes and contracts for the current snow event. Updates in real-time.
          </p>
        </div>
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-5 w-5" />
          Generate Report
        </Button>
      </div>

      {routes.length > 0 ? (
        <div className="space-y-8">
          {routes.map(route => {
             const routeCrew = users.filter(u => route.assignedEmployeeIds?.includes(u.id));
             const routeFleet = fleetAssets.filter(a => route.assignedVehicleIds?.includes(a.id));
             const routeJobs = (route.assignedJobIds || []).map(id => jobs.find(j => j.id === id)).filter((j): j is Job => !!j);

            return (
            <Card key={route.id} className="printable-card bg-card/90 backdrop-blur-xl border-2 border-primary/20 shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-headline capitalize">{route.name}</CardTitle>
                            <CardDescription>Type: <span className="capitalize font-medium">{route.type}</span></CardDescription>
                        </div>
                         <Button onClick={() => handleOptimizeRoute(route)} className="print-hidden" disabled={optimizingRouteId === route.id}>
                            {optimizingRouteId === route.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Brain className="mr-2 h-4 w-4" />
                            )}
                            {optimizingRouteId === route.id ? 'Optimizing...' : 'Optimize Route'}
                        </Button>
                    </div>
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
                    {routeJobs.map(job => {
                        const services: {key: ServiceType, label: string}[] = [
                            ...(job.snowServices?.plowing && route.type === 'plowing' ? [{key: 'plowing' as ServiceType, label: 'Plowing'}] : []),
                            ...(job.snowServices?.salting && route.type === 'salting' ? [{key: 'salting' as ServiceType, label: 'Salting'}] : []),
                            ...(job.snowServices?.sidewalks && route.type === 'sidewalks' ? [{key: 'sidewalks' as ServiceType, label: 'Sidewalks'}] : [])
                        ];
                        
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
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Separator />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map(({key, label}) => {
                                        const lastLog = getMostRecentLog(job, key);
                                        const logCount = job.snowLog?.[key]?.length || 0;
                                        return (
                                            <div key={key} className="p-3 border rounded-md bg-background/50 space-y-2 flex flex-col justify-between">
                                                <h4 className="font-semibold">{label}</h4>
                                                {lastLog ? (
                                                    <div className="text-xs text-muted-foreground">
                                                        <p>Last done {formatDistanceToNow(parseISO(lastLog.timestamp), { addSuffix: true })}</p>
                                                        <p>by {lastLog.employeeName}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-destructive font-medium">Pending</p>
                                                )}
                                                <div className="flex items-center gap-2 pt-2 border-t print-hidden">
                                                    <Button size="sm" className="flex-1" onClick={() => setLogServiceInfo({ job, service: key })}>
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Log
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={logCount === 0} onClick={() => setHistoryInfo({job, service: key})}>
                                                        <History className="mr-2 h-4 w-4" /> Hist. ({logCount})
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
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

    {/* Log Service Dialog */}
    <Dialog open={!!logServiceInfo} onOpenChange={() => { setLogServiceInfo(null); form.reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log {logServiceInfo?.service} Service</DialogTitle>
          <DialogDescription>
            Confirming service for {logServiceInfo?.job.clientName}. Add an optional photo for verification.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onLogSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="photoDataUri"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Verification Photo (Optional)</FormLabel>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={handleOpenCamera}><Camera className="mr-2 h-4 w-4"/>Use Camera</Button>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4"/>Upload</Button>
                            <Input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        </div>
                        {field.value && <Image src={field.value} alt="Preview" width={80} height={80} className="rounded-md border mt-2" />}
                    </FormItem>
                )}
            />
            <DialogFooter>
                <Button type="submit">Log Service</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Camera Dialog */}
    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Take Verification Photo</DialogTitle></DialogHeader>
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline />
            <DialogFooter>
                <Button type="button" onClick={handleCapturePhoto} className="w-full"><Camera className="mr-2 h-4 w-4"/>Capture</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* History Dialog */}
    <Dialog open={!!historyInfo} onOpenChange={() => setHistoryInfo(null)}>
        <DialogContent className="max-w-2xl">
             <DialogHeader>
                <DialogTitle>{historyInfo?.service.charAt(0).toUpperCase() + historyInfo!.service.slice(1)} History</DialogTitle>
                <DialogDescription>Service log for {historyInfo?.job.clientName}.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-4">
                {(historyInfo?.job.snowLog?.[historyInfo.service] || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                    <div key={log.timestamp} className="p-3 border rounded-md flex gap-4">
                        {log.photoDataUri && (
                             <a href={log.photoDataUri} target="_blank" rel="noopener noreferrer" className="relative shrink-0">
                                <Image src={log.photoDataUri} alt="Verification photo" width={80} height={80} className="rounded-md object-cover"/>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 hover:opacity-100 transition-opacity">
                                    <Eye className="h-6 w-6 text-white"/>
                                </div>
                            </a>
                        )}
                        <div className="text-sm">
                            <p><strong>Completed:</strong> {format(parseISO(log.timestamp), 'PPpp')}</p>
                            <p><strong>By:</strong> {log.employeeName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </DialogContent>
    </Dialog>

    {/* Optimized Route Plan Dialog */}
    <Dialog open={!!optimizedRoutePlan} onOpenChange={() => setOptimizedRoutePlan(null)}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    AI-Optimized Route Plan
                </DialogTitle>
                <DialogDescription className="pt-2 text-base">
                    <strong>AI Rationale:</strong> {optimizedRoutePlan?.rationale}
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                {optimizedRoutePlan?.optimizedJobs.map((job, index) => (
                    <div key={job.id} className="p-3 border rounded-md flex items-center gap-4 bg-muted/50">
                        <span className="text-xl font-bold text-primary w-6 text-center">{index + 1}</span>
                        <div>
                            <p className="font-semibold">{job.name}</p>
                            <p className="text-sm text-muted-foreground">{job.address}</p>
                        </div>
                    </div>
                ))}
            </div>
            <DialogFooter>
                <Button onClick={openRouteInMaps} className="w-full">
                    <MapPin className="mr-2 h-4 w-4" /> Open in Google Maps
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
