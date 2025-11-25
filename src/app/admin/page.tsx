
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Truck, CalendarDays, Loader2, Calendar as CalendarIcon, Cog, ClipboardList, Coins, AlertTriangle, Briefcase, Building2, ClipboardEdit, Brain, Sparkles, ThumbsUp, ListTodo, SlidersHorizontal, FileBadge, Snowflake, Users as UsersIcon, Droplets, Package, Hammer, HeartPulse, Calculator, Route, ArrowRightLeft, BookOpen, Wrench, FileText, ShieldAlert } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useMemo, useState } from 'react';
import type { CalendarEvent, Job } from '@/lib/types';
import type { DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import { isSameDay, format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Send } from 'lucide-react';
import GuidedTour from '@/components/common/GuidedTour';
import type { TourStep } from '@/components/common/GuidedTour';
import WeatherForecast from '@/components/admin/WeatherForecast';
import Image from 'next/image';

const getBriefingItemIcon = (type: string) => {
  switch (type) {
    case 'report': return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'job': return <Briefcase className="h-5 w-5 text-primary" />;
    case 'request': return <ClipboardCheck className="h-5 w-5 text-blue-500" />;
    case 'task': return <ListTodo className="h-5 w-5 text-purple-500" />;
    case 'event': return <CalendarIcon className="h-5 w-5 text-green-500" />;
    default: return <Sparkles className="h-5 w-5 text-yellow-500" />;
  }
};

const DailyBriefingCard = ({ briefing, isLoading }: { briefing: DailyBriefingOutput | null, isLoading: boolean }) => {
  if (isLoading) {
    return (
       <Card className="mb-8 border-primary/30 shadow-xl bg-primary/5 hover:shadow-primary/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-primary">
              <Brain />
              AI Daily Briefing
            </CardTitle>
            <CardDescription>
              Your intelligent assistant is analyzing today's operational data...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </CardContent>
        </Card>
    );
  }

  if (!briefing) {
     return (
       <Card className="mb-8 border-destructive/50 shadow-xl bg-destructive/5 hover:shadow-destructive/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-destructive">
              <AlertTriangle />
              Briefing Not Available
            </CardTitle>
            <CardDescription>
              The AI-powered daily briefing could not be generated at this time.
            </CardDescription>
          </CardHeader>
        </Card>
    );
  }

  const allItems = [...briefing.attentionItems, ...briefing.todaysAgenda, ...briefing.pendingActions];

  if (allItems.length === 0) {
      return (
           <Card className="mb-8 border-primary/50 shadow-xl bg-primary/5 hover:shadow-primary/20 transition-all duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-primary">
                    <ThumbsUp />
                    All Clear!
                    </CardTitle>
                    <CardDescription>
                    Your AI assistant has reviewed all operational data. There are no urgent items, pending actions, or scheduled events for today.
                    </CardDescription>
                </CardHeader>
            </Card>
      );
  }

  return (
    <Card className="mb-8 border-primary/30 shadow-xl bg-primary/5 hover:shadow-primary/20 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-primary">
          <Brain />
          AI Daily Briefing for {format(new Date(), 'PPP')}
        </CardTitle>
        <CardDescription>
          Your AI assistant has summarized the key items for your attention today. Note: Some data sources are still being migrated to Firestore, so this briefing may be incomplete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {briefing.attentionItems.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="text-destructive"/>Urgent Attention</h3>
            <ul className="space-y-2">
              {briefing.attentionItems.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-md border bg-card/80 hover:bg-card">
                  <div className="flex items-center gap-3">
                    {getBriefingItemIcon(item.type)}
                    <p>{item.summary}</p>
                  </div>
                  <Link href={item.link} passHref><Button variant="secondary" size="sm">View</Button></Link>
                </li>
              ))}
            </ul>
          </div>
        )}
         {briefing.todaysAgenda.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><CalendarDays className="text-primary/80"/>Today's Agenda</h3>
            <ul className="space-y-2">
              {briefing.todaysAgenda.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-md border bg-card/80 hover:bg-card">
                  <div className="flex items-center gap-3">
                    {getBriefingItemIcon(item.type)}
                    <p>{item.summary}</p>
                  </div>
                  <Link href={item.link} passHref><Button variant="secondary" size="sm">View</Button></Link>
                </li>
              ))}
            </ul>
          </div>
        )}
         {briefing.pendingActions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><ClipboardCheck className="text-blue-500"/>Pending Actions</h3>
            <ul className="space-y-2">
              {briefing.pendingActions.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-md border bg-card/80 hover:bg-card">
                  <div className="flex items-center gap-3">
                    {getBriefingItemIcon(item.type)}
                    <p>{item.summary}</p>
                  </div>
                  <Link href={item.link} passHref><Button variant="secondary" size="sm">Review</Button></Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const managerTourSteps: TourStep[] = [
    { element: '#tour-step-admin-welcome', title: "Welcome to the Admin Dashboard", content: "This is your command center for managing all fleet operations. Let's take a quick look at the key features.", side: 'bottom' },
    { element: '#tour-step-weather-forecast', title: "Daily Weather Forecast", content: "At the top, you'll find the daily weather forecast for your operational area, helping you plan for the day ahead.", side: 'bottom' },
    { element: '#tour-step-ai-briefing', title: "AI Daily Briefing", content: "The AI Daily Briefing is your intelligent assistant. It analyzes all data to give you a summary of the day's most important items, like failed inspections and pending requests.", side: 'bottom' },
    { element: '#tour-step-calendar', title: "Operations Calendar", content: "The Operations Calendar gives you a complete view of all scheduled jobs, company events, and approved time off. Click a date to see the agenda for that day.", side: 'bottom' },
    { element: '#tour-step-management-hubs', title: "Management Sections", content: "The cards below are your main navigation hubs. From here, you can manage everything from employees and clients to jobs, reports, and maintenance logs.", side: 'top' },
    { element: '#tour-step-sidebar-help', title: "Advanced Tools & Help", content: "For deep insights, visit 'Advanced Reports'. For application-wide settings, go to 'System Settings'. You can find everything in the sidebar too. If you need a reminder, visit the 'Help & Support' page. Enjoy exploring!", side: 'right' },
];

export default function FleetCheckDashboardPage() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefingOutput | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();


  useEffect(() => {
    setIsMounted(true);
    const hasViewedTour = localStorage.getItem('hasViewedTour_manager');
    if (searchParams.get('tour') === 'true' && !hasViewedTour) {
        setIsTourOpen(true);
    }

    const fetchData = async () => {
        setIsBriefingLoading(true);
        try {
            // Get server-side data from the action
            const data = await getAdminDashboardData();
            
            setBriefing(data.briefing);
            setJobs(data.jobs);
            setEvents(data.events);

            if (!data.briefing) {
                toast({
                    variant: 'destructive',
                    title: 'AI Briefing Failed',
                    description: 'Could not generate the daily briefing.'
                });
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            toast({
                variant: 'destructive',
                title: 'Dashboard Error',
                description: 'Could not load all dashboard data.'
            });
        } finally {
            setIsBriefingLoading(false);
        }
    };

    fetchData();
  }, [toast, searchParams]);

  const { eventDates, jobRanges } = useMemo(() => {
    const eventDates = events.filter(event => event.date).map(event => parseISO(event.date));
    const jobRanges = jobs.filter(job => job.startDate && job.endDate).map(job => ({
      from: parseISO(job.startDate),
      to: parseISO(job.endDate),
    }));
    return { eventDates, jobRanges };
  }, [events, jobs]);

  const selectedDayItems = useMemo(() => {
    if (!date) return [];
    
    const dayEvents = events
      .filter(event => event.date && isSameDay(parseISO(event.date), date))
      .map(e => ({ ...e, itemType: 'event' as const }));

    const dayJobs = jobs
      .filter(job => job.startDate && job.endDate && isWithinInterval(date, { start: parseISO(job.startDate), end: parseISO(job.endDate) }))
      .map(j => ({ ...j, itemType: 'job' as const }));
    
    const combined = [...dayJobs, ...dayEvents];
    return combined;

  }, [date, events, jobs]);
  
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'time-off': return 'Time Off';
        case 'company-event': return 'Company Event';
        case 'maintenance': return 'Maintenance';
        default: return 'Event';
    }
  }

  const getJobTypeIcon = (type: Job['jobType']) => {
    switch(type) {
        case 'excavation': return <Briefcase className="h-5 w-5 text-primary mt-1" />;
        case 'snow_removal': return <Snowflake className="h-5 w-5 text-primary mt-1" />;
        case 'concrete': return <Droplets className="h-5 w-5 text-primary mt-1" />;
        case 'misc': return <Package className="h-5 w-5 text-primary mt-1" />;
    }
  }

  if (!isMounted) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <>
    <GuidedTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        steps={managerTourSteps}
        tourKey="hasViewedTour_manager"
    />
    <div className="container mx-auto py-8">
      <div id="tour-step-admin-welcome" className="mb-12 text-center">
        <Image src="/logo.png" alt="Logan's Excavating Logo" width={200} height={50} className="w-auto h-12 mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Welcome, {user?.name}. Oversee operations, assets, and personnel.
        </p>
      </div>
      
      <WeatherForecast tourId="tour-step-weather-forecast" />
      
      <div id="tour-step-ai-briefing">
        <DailyBriefingCard briefing={briefing} isLoading={isBriefingLoading} />
      </div>

       <Card id="tour-step-calendar" className="mb-8 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarIcon className="text-primary" />
            Operations Calendar
          </CardTitle>
          <CardDescription>
            At-a-glance view of jobs, company events, and approved time off. <Link href="/admin/manage-calendar" className="text-primary hover:underline">Manage company events here.</Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{ event: eventDates, job: jobRanges }}
              modifiersClassNames={{
                event: 'day-with-event',
                job: 'day-with-job',
              }}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Agenda for {date ? format(date, 'PPP') : '...'}</h3>
            {selectedDayItems.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedDayItems.map(item => (
                    <li key={item.id} className="p-3 rounded-md border bg-muted/50 flex items-start gap-3">
                      {item.itemType === 'job' ? getJobTypeIcon(item.jobType) : <CalendarIcon className="h-5 w-5 text-primary mt-1" />}
                      <div>
                        <p className="font-semibold">{item.title || item.name}</p>
                        {item.itemType === 'job' ? (
                          <>
                            <p className="text-sm text-muted-foreground">Job for: {item.clientName}</p>
                            <Link href={`/admin/jobs/${item.id}`} className="text-sm text-primary hover:underline">View Job Details</Link>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground">{getEventTypeLabel(item.type)}</p>
                            {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2"/>
                    <p>No events for this day.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>


      <div id="tour-step-management-hubs" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* People & Communication Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Users className="text-primary" />
              People & Comms
            </CardTitle>
            <CardDescription>
              Manage employees, requests, tasks, violations, and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {user?.role === 'owner' && <Link href="/admin/manage-users" passHref><Button variant="outline" className="w-full justify-start"><Users />Manage Employees</Button></Link>}
            <Link href="/admin/manage-requests" passHref><Button variant="outline" className="w-full justify-start"><ClipboardCheck />Manage Time Off Requests</Button></Link>
            {user?.role === 'owner' && <Link href="/admin/manage-expenses" passHref><Button variant="outline" className="w-full justify-start"><Coins />Manage Expenses</Button></Link>}
            <Link href="/admin/manage-tasks" passHref><Button variant="outline" className="w-full justify-start"><ListTodo />Manage Tasks</Button></Link>
            <Link href="/admin/manage-violations" passHref><Button variant="outline" className="w-full justify-start"><ShieldAlert />Manage Violations</Button></Link>
            <Link href="/admin/personal-documents" passHref><Button variant="outline" className="w-full justify-start"><FileBadge />Personal Documents</Button></Link>
            <Link href="/admin/send-notification" passHref><Button variant="outline" className="w-full justify-start"><Send />Send Notification</Button></Link>
          </CardContent>
        </Card>

        {/* Assets & Content Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Cog className="text-primary" />
              Assets & Content
            </CardTitle>
            <CardDescription>
              Manage fleet vehicles, company documents, and the events calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/manage-fleet" passHref><Button variant="outline" className="w-full justify-start"><Truck />Manage Fleet</Button></Link>
            <Link href="/admin/manage-inventory" passHref><Button variant="outline" className="w-full justify-start"><Hammer />Manage Inventory</Button></Link>
            <Link href="/admin/manage-documents" passHref><Button variant="outline" className="w-full justify-start"><BookOpen />Policies & Documents</Button></Link>
            <Link href="/admin/manage-calendar" passHref><Button variant="outline" className="w-full justify-start"><CalendarIcon />Manage Calendar</Button></Link>
          </CardContent>
        </Card>

        {/* Operations & Analytics Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <LineChart className="text-primary" />
              Operations & Analytics
            </CardTitle>
            <CardDescription>
              Review reports, logs, jobs, clients, and access advanced analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {user?.role === 'owner' && <>
            <Link href="/admin/manage-clients" passHref><Button variant="outline" className="w-full justify-start"><Building2 />Manage Clients</Button></Link>
            <Link href="/admin/manage-jobs" passHref><Button variant="outline" className="w-full justify-start"><Briefcase />All Jobs</Button></Link>
            <Link href="/admin/manage-rentals" passHref><Button variant="outline" className="w-full justify-start"><ArrowRightLeft />Manage Rentals</Button></Link>
            <Link href="/admin/manage-snow-routes" passHref><Button variant="outline" className="w-full justify-start"><Route />Snow Routes</Button></Link>
            </>}
            <Link href="/reports" passHref><Button variant="outline" className="w-full justify-start"><FileText />View Inspection Reports</Button></Link>
            <Link href="/admin/manage-work-orders" passHref><Button variant="outline" className="w-full justify-start"><ClipboardEdit />Manage Work Orders</Button></Link>
            <Link href="/admin/maintenance-logs" passHref><Button variant="outline" className="w-full justify-start"><Wrench />View Maintenance Logs</Button></Link>
            {user?.role === 'owner' && <Link href="/admin/advanced-reports" passHref><Button variant="outline" className="w-full justify-start"><LineChart />Advanced Reports</Button></Link>}
            <Link href="/admin/fleet-health" passHref><Button variant="outline" className="w-full justify-start"><HeartPulse />Fleet Health</Button></Link>
          </CardContent>
        </Card>
        
        {/* System & Access Card */}
        {user?.role === 'owner' && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <SlidersHorizontal className="text-primary" />
                System & Tools
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and access utilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/admin/system-settings" passHref><Button variant="outline" className="w-full justify-start"><SlidersHorizontal />System Settings</Button></Link>
              <Link href="/admin/fleet-tools" passHref><Button variant="outline" className="w-full justify-start"><Calculator />Operations Toolkit</Button></Link>
              <Link href="/employee" passHref><Button variant="outline" className="w-full justify-start"><Users />Go to Employee Portal</Button></Link>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
    </>
  );
}
