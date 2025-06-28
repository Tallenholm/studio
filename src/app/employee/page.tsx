
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, User, Calendar as CalendarIcon, CalendarDays, CalendarPlus, Loader2, FileText, Bell, Files, ClipboardList, Receipt, ShieldAlert, FileBadge, Check, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarEvent, Job, Task, InspectionReport } from '@/lib/types';
import { loadCalendarEvents, loadJobs, loadTasks, loadInspectionReports } from '@/lib/localStorageService';
import { isSameDay, format, parseISO } from 'date-fns';
import GuidedTour from '@/components/common/GuidedTour';
import type { TourStep } from '@/components/common/GuidedTour';
import { getJobStatus } from '@/lib/job-utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';

const employeeTourSteps: TourStep[] = [
    { element: '#tour-step-employee-welcome', title: "Welcome to the Employee Hub!", content: "This is your one-stop shop for daily tasks and company resources. Let's take a quick tour.", side: 'bottom' },
    { element: '#tour-step-main-tools', title: "Your Main Tools", content: "These cards are your main tools. Here you can start vehicle inspections ('Fleet Check'), view your tasks, request time off, and more.", side: 'bottom' },
    { element: '#tour-step-job-board', title: "Your Job Board", content: "This section shows your currently active and upcoming jobs. You can get directions to the job site directly from here.", side: 'bottom' },
    { element: '#tour-step-company-calendar', title: "Company Calendar", content: "The Company Calendar shows you all company-wide events and your approved time off. Click any date to see what's scheduled.", side: 'bottom' },
    { element: '#tour-step-sidebar', title: "Sidebar Navigation", content: "You can also access all these tools from the sidebar menu on the left. New notifications will appear with a badge, so keep an eye out.", side: 'right' },
    { element: '#tour-step-sidebar-help-employee', title: "Get Help", content: "If you ever need a reminder, click the 'Help & Support' link at the bottom of the sidebar for a full guide to all features. You're all set!", side: 'right' },
];

export default function EmployeeHubPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<InspectionReport[]>([]);

  const [isTourOpen, setIsTourOpen] = useState(false);

   useEffect(() => {
    setIsMounted(true);
    const hasViewedTour = localStorage.getItem('hasViewedTour_employee');
    if (searchParams.get('tour') === 'true' && !hasViewedTour) {
        setIsTourOpen(true);
    }
    
    if (user) {
        setEvents(loadCalendarEvents());
        setJobs(loadJobs());
        setTasks(loadTasks().filter(t => t.assignedToEmployeeId === user.id));
        setReports(loadInspectionReports().filter(r => r.employeeId === user.id));
    }
  }, [searchParams, user]);

  const assignedJobs = useMemo(() => {
    if (!user) return [];
    return jobs
      .filter(job => 
        job.assignedTruckIds?.includes(user.id) ||
        job.assignedTrailerIds?.includes(user.id) ||
        job.assignedHeavyEquipmentIds?.includes(user.id)
      )
      .map(job => ({ ...job, status: getJobStatus(job) }))
      .filter(job => job.status === 'active' || job.status === 'upcoming')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs, user]);

  const eventDates = useMemo(() => {
    return events.map(event => parseISO(event.date));
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!date) return [];
    return events.filter(event => isSameDay(parseISO(event.date), date));
  }, [date, events]);
  
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'time-off': return 'Time Off';
        case 'company-event': return 'Company Event';
        case 'maintenance': return 'Maintenance';
        default: return 'Event';
    }
  }

  if (!isMounted) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Hub...</p>
      </div>
    );
  }


  return (
    <>
    <GuidedTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        steps={employeeTourSteps}
        tourKey="hasViewedTour_employee"
    />
    <div className="container mx-auto py-8">
      <div id="tour-step-employee-welcome" className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold mb-4">Welcome, {user?.name || 'Employee'}!</h1>
        <p className="text-2xl text-muted-foreground">
          Your central hub for work tools.
        </p>
      </div>

       <div id="tour-step-main-tools" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Link href="/employee/fleet-check" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Truck className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Fleet Check
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Daily vehicle inspections.
                  </CardDescription>
                </Card>
            </Link>
            <Link href="/employee/my-tasks" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <ClipboardList className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    View & complete assigned tasks.
                  </CardDescription>
                </Card>
            </Link>
            <Link href="/employee/time-off" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <CalendarPlus className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Time Off
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Request time off.
                  </CardDescription>
                </Card>
            </Link>
            <Link href="/employee/submit-expense" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Receipt className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Submit Expense
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Upload receipts for reimbursement.
                  </CardDescription>
                </Card>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            <div id="tour-step-job-board" className="lg:col-span-3">
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl h-full">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <Briefcase className="h-6 w-6 text-primary" /> Your Job Board
                        </CardTitle>
                        <CardDescription>Active and upcoming jobs assigned to you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {assignedJobs.length > 0 ? (
                            assignedJobs.map(job => (
                                <Card key={job.id} className="p-4 bg-muted/30">
                                    <div className="flex justify-between items-center gap-4">
                                        <div>
                                            <p className="font-bold">{job.name}</p>
                                            <p className="text-sm text-muted-foreground">{job.clientName}</p>
                                            <p className="text-xs text-muted-foreground">{job.address}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant={job.status === 'active' ? 'default' : 'outline'} className={job.status === 'active' ? 'bg-green-600' : ''}>{job.status}</Badge>
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="outline"><MapPin className="mr-2 h-4 w-4" /> Directions</Button>
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                                <Briefcase className="h-8 w-8 mx-auto mb-2"/>
                                <p>You have no active or upcoming jobs.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl text-center flex flex-col justify-center items-center p-4">
                    <Check className="h-8 w-8 text-primary mb-2" />
                    <p className="text-4xl font-bold"><AnimatedCounter value={tasks.filter(t => t.status === 'completed').length} /></p>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </Card>
                 <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl text-center flex flex-col justify-center items-center p-4">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <p className="text-4xl font-bold"><AnimatedCounter value={reports.length} /></p>
                    <p className="text-sm text-muted-foreground">Inspections Done</p>
                </Card>
            </div>
        </div>

       <div id="tour-step-company-calendar">
          <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <CalendarIcon className="text-primary" />
                Company Calendar
              </CardTitle>
              <CardDescription>
                View company events, approved time off, and maintenance schedules.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  modifiers={{ event: eventDates }}
                  modifiersClassNames={{
                    event: 'day-with-event',
                  }}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Events for {date ? format(date, 'PPP') : '...'}</h3>
                {selectedDayEvents.length > 0 ? (
                    <ul className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedDayEvents.map(event => (
                        <li key={event.id} className="p-3 rounded-md border bg-muted/50">
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{getEventTypeLabel(event.type)}</p>
                            {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
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
       </div>
    </div>
    </>
  );
}
