
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Truck, CalendarDays, Loader2, Calendar as CalendarIcon, Cog, ClipboardList, Coins, AlertTriangle, CheckCircle2, Briefcase, Building2, ClipboardEdit, Brain, Sparkles, ThumbsUp, ListTodo } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useMemo, useState } from 'react';
import type { CalendarEvent, InspectionReport, FleetAsset, Job, TimeOffRequest, ExpenseReport, Task } from '@/lib/types';
import type { DailyBriefingOutput } from '@/ai/flows/generate-daily-briefing';
import { loadCalendarEvents, loadInspectionReports, loadFleetAssets, loadJobs, loadTimeOffRequests, loadExpenseReports, loadTasks } from '@/lib/localStorageService';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing';
import { isSameDay, format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
           <Card className="mb-8 border-green-500/50 shadow-xl bg-green-500/5 hover:shadow-green-500/20 transition-all duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-green-600">
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
          Your AI assistant has summarized the key items for your attention today.
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


export default function FleetCheckDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [briefing, setBriefing] = useState<DailyBriefingOutput | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(true);
  const { toast } = useToast();


  useEffect(() => {
    setIsMounted(true);
    const loadedEvents = loadCalendarEvents();
    const loadedJobs = loadJobs();
    
    setEvents(loadedEvents);
    setJobs(loadedJobs);
    
    // Generate AI Briefing
    const runBriefing = async () => {
        try {
            const briefingInput = {
                date: new Date().toISOString(),
                jobs: JSON.stringify(loadedJobs),
                reports: JSON.stringify(loadInspectionReports()),
                timeOffRequests: JSON.stringify(loadTimeOffRequests()),
                expenseReports: JSON.stringify(loadExpenseReports()),
                tasks: JSON.stringify(loadTasks()),
                events: JSON.stringify(loadedEvents),
            };
            const result = await generateDailyBriefing(briefingInput);
            setBriefing(result);
        } catch (error) {
            console.error("Failed to generate daily briefing:", error);
            toast({
                variant: 'destructive',
                title: 'AI Briefing Failed',
                description: 'Could not generate the daily briefing. Please check the logs.'
            })
            setBriefing(null);
        } finally {
            setIsBriefingLoading(false);
        }
    };
    runBriefing();

  }, [toast]);

  const { eventDates, jobRanges } = useMemo(() => {
    const eventDates = events.map(event => parseISO(event.date));
    const jobRanges = jobs.map(job => ({
      from: parseISO(job.startDate),
      to: parseISO(job.endDate),
    }));
    return { eventDates, jobRanges };
  }, [events, jobs]);

  const selectedDayItems = useMemo(() => {
    if (!date) return [];
    
    const dayEvents = events
      .filter(event => isSameDay(parseISO(event.date), date))
      .map(e => ({ ...e, itemType: 'event' as const }));

    const dayJobs = jobs
      .filter(job => isWithinInterval(date, { start: parseISO(job.startDate), end: parseISO(job.endDate) }))
      .map(j => ({ ...j, itemType: 'job' as const }));
    
    const combined = [...dayJobs, ...dayEvents];
    return combined;

  }, [date, events, jobs]);
  
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'time-off': return 'Time Off';
        case 'company-event': return 'Company Event';
        case 'maintenance': return 'Event';
        default: return 'Event';
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
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <Truck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Oversee fleet assets, users, reports, and settings for the Fleet Check app.
        </p>
      </div>
      
      <DailyBriefingCard briefing={briefing} isLoading={isBriefingLoading} />

       <Card className="mb-8 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarIcon className="text-primary" />
            Operations Calendar
          </CardTitle>
          <CardDescription>
            At-a-glance view of jobs, company events, time off, and maintenance schedules. <Link href="/admin/manage-calendar" className="text-primary hover:underline">Click here to manage events.</Link>
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
                      {item.itemType === 'job' ? <Briefcase className="h-5 w-5 text-primary mt-1" /> : <CalendarIcon className="h-5 w-5 text-primary mt-1" />}
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* People & Communication Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Users className="text-primary" />
              People & Communication
            </CardTitle>
            <CardDescription>
              Manage employees, requests, tasks, violations, and send notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/manage-users" passHref><Button variant="outline" className="w-full justify-start">Manage Employees</Button></Link>
            <Link href="/admin/manage-requests" passHref><Button variant="outline" className="w-full justify-start">Manage Time Off Requests</Button></Link>
            <Link href="/admin/manage-expenses" passHref><Button variant="outline" className="w-full justify-start">Manage Expenses</Button></Link>
            <Link href="/admin/manage-tasks" passHref><Button variant="outline" className="w-full justify-start">Manage Tasks</Button></Link>
            <Link href="/admin/manage-violations" passHref><Button variant="outline" className="w-full justify-start">Manage Violations</Button></Link>
            <Link href="/admin/send-notification" passHref><Button variant="outline" className="w-full justify-start">Send Notification</Button></Link>
          </CardContent>
        </Card>

        {/* Content & Assets Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <ClipboardList className="text-primary" />
              Assets & Content
            </CardTitle>
            <CardDescription>
              Manage fleet vehicles, company documents, and the events calendar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/manage-fleet" passHref><Button variant="outline" className="w-full justify-start">Manage Fleet</Button></Link>
            <Link href="/admin/manage-documents" passHref><Button variant="outline" className="w-full justify-start">Manage Documents</Button></Link>
            <Link href="/admin/manage-calendar" passHref><Button variant="outline" className="w-full justify-start">Manage Calendar</Button></Link>
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
              Review inspection reports, view maintenance logs, and access advanced analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/reports" passHref><Button variant="outline" className="w-full justify-start">View Inspection Reports</Button></Link>
            <Link href="/admin/maintenance-logs" passHref><Button variant="outline" className="w-full justify-start">View Maintenance Logs</Button></Link>
            <Link href="/admin/manage-work-orders" passHref><Button variant="outline" className="w-full justify-start">Manage Work Orders</Button></Link>
            <Link href="/admin/manage-clients" passHref><Button variant="outline" className="w-full justify-start">Manage Clients</Button></Link>
            <Link href="/admin/manage-jobs" passHref><Button variant="outline" className="w-full justify-start">Manage Jobs</Button></Link>
            <Link href="/admin/advanced-reports" passHref><Button variant="outline" className="w-full justify-start">Advanced Reports</Button></Link>
          </CardContent>
        </Card>
        
        {/* System & Access Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Cog className="text-primary" />
              System & Access
            </CardTitle>
            <CardDescription>
              Configure system-wide settings and access the employee portal view.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/system-settings" passHref><Button variant="outline" className="w-full justify-start">System Settings</Button></Link>
            <Link href="/employee" passHref><Button variant="outline" className="w-full justify-start">Go to Employee Portal</Button></Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
