
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, CalendarDays, CalendarPlus, Loader2, FileText, Receipt, ShieldAlert, FileBadge, Check, MapPin, Briefcase, Snowflake, Users as UsersIcon, Droplets, Package, ClipboardList, Route, BookOpen } from 'lucide-react';
import { useUser } from '@/firebase/provider';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarEvent, Job, Task, InspectionReport } from '@/lib/types';
import { isSameDay, format, parseISO, isWithinInterval } from 'date-fns';
import GuidedTour from '@/components/common/GuidedTour';
import type { TourStep } from '@/components/common/GuidedTour';
import { getJobStatus } from '@/lib/job-utils';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import type { EmployeeDashboardData } from '@/app/actions/getEmployeeDashboardData';

const employeeTourSteps: TourStep[] = [
    { element: '#tour-step-employee-welcome', title: "Welcome to the Employee Hub!", content: "This is your one-stop shop for daily tasks and company resources. Let's take a quick tour.", side: 'bottom' },
    { element: '#tour-step-weather-forecast-employee', title: "Daily Weather Forecast", content: "Check the local weather forecast here to help you prepare for the day's conditions.", side: 'bottom' },
    { element: '#tour-step-main-tools', title: "Your Main Tools", content: "These cards are your main tools. Here you can start vehicle inspections ('Vehicle Inspections'), view your tasks, request time off, and more.", side: 'bottom' },
    { element: '#tour-step-job-board', title: "Your Assignments", content: "This section shows your currently active and upcoming assignments, separated by job type. You can get directions to the job site directly from here.", side: 'bottom' },
    { element: '#tour-step-company-calendar', title: "Company Calendar", content: "The Company Calendar shows you all company-wide events and your approved time off. Click any date to see what's scheduled.", side: 'bottom' },
    { element: '#tour-step-sidebar', title: "Sidebar Navigation", content: "You can also access all these tools from the sidebar menu on the left. New notifications will appear with a badge, so keep an eye out.", side: 'right' },
    { element: '#tour-step-sidebar-help-employee', title: "Get Help", content: "If you ever need a reminder, click the 'Help & Support' link at the bottom of the sidebar for a full guide to all features. You're all set!", side: 'right' },
];

interface EmployeeHubClientPageProps {
  initialData: EmployeeDashboardData | null;
}

export default function EmployeeHubClientPage({ initialData }: EmployeeHubClientPageProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(initialData);
  const [isTourOpen, setIsTourOpen] = useState(false);

   useEffect(() => {
    const hasViewedTour = localStorage.getItem('hasViewedTour_employee');
    if (searchParams.get('tour') === 'true' && !hasViewedTour) {
        setIsTourOpen(true);
    }
  }, [searchParams]);

  const { 
    assignedExcavationJobs, 
    assignedSnowContracts, 
    assignedConcreteJobs, 
    assignedMiscJobs,
    employeeTasks,
    employeeReports 
  } = useMemo(() => {
    if (!user || !dashboardData) {
        return { 
            assignedExcavationJobs: [], 
            assignedSnowContracts: [], 
            assignedConcreteJobs: [], 
            assignedMiscJobs: [],
            employeeTasks: [],
            employeeReports: []
        };
    }
    
    const assignedJobs = dashboardData.jobs
      .filter(job => 
        job.assignedEmployeeIds?.includes(user.uid) ||
        job.assignedTruckIds?.includes(user.uid) || // For older data model compatibility
        job.assignedSidewalkCrewIds?.includes(user.uid)
      )
      .map(job => ({ ...job, status: getJobStatus(job) }))
      .filter(job => job.status === 'active' || job.status === 'upcoming')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
    return {
        assignedExcavationJobs: assignedJobs.filter(j => j.jobType === 'excavation'),
        assignedSnowContracts: assignedJobs.filter(j => j.jobType === 'snow_removal'),
        assignedConcreteJobs: assignedJobs.filter(j => j.jobType === 'concrete'),
        assignedMiscJobs: assignedJobs.filter(j => j.jobType === 'misc'),
        employeeTasks: dashboardData.tasks.filter(t => t.assignedToEmployeeId === user.uid),
        employeeReports: dashboardData.reports.filter(r => r.employeeId === user.uid),
    };
  }, [dashboardData, user]);

  const eventDates = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.events.filter(event => event.date).map(event => parseISO(event.date));
  }, [dashboardData]);

  const selectedDayEvents = useMemo(() => {
    if (!date || !dashboardData) return [];
    return dashboardData.events.filter(event => event.date && isSameDay(parseISO(event.date), date));
  }, [date, dashboardData]);
  
  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
        case 'time-off': return 'Time Off';
        case 'company-event': return 'Company Event';
        case 'maintenance': return 'Maintenance';
        default: return 'Event';
    }
  }

  const renderJobBoard = (jobs: (Job & {status: JobStatus})[], jobType: Job['jobType']) => {
      const icons = {
          excavation: Briefcase,
          snow_removal: Snowflake,
          concrete: Droplets,
          misc: Package
      };
      const Icon = icons[jobType];
      
      return (
        <div className="space-y-4">
            {jobs.length > 0 ? (
                jobs.map(job => (
                    <Card key={job.id} className="p-4 bg-muted/30">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-bold">{job.name}</p>
                                <p className="text-sm text-muted-foreground">{job.clientName}</p>
                                <p className="text-xs text-muted-foreground">{job.address}</p>
                                {job.jobType === 'snow_removal' && job.assignedSidewalkCrewIds?.includes(user!.uid) && (
                                    <Badge variant="outline" className="mt-2 text-primary border-primary">
                                        <UsersIcon className="mr-1.5 h-3 w-3" />
                                        Sidewalk Crew
                                    </Badge>
                                )}
                                {job.jobType === 'snow_removal' && job.assignedTruckIds?.includes(user!.uid) && (
                                     <Badge variant="outline" className="mt-2 text-primary border-primary ml-2">
                                        <Truck className="mr-1.5 h-3 w-3" />
                                        Plow Crew
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant={job.status === 'active' ? 'default' : 'outline'} className={job.status === 'active' ? 'bg-green-600' : ''}>{job.status}</Badge>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline"><MapPin /> Directions</Button>
                                </a>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    {React.createElement(Icon, { className: "h-8 w-8 mx-auto mb-2"})}
                    <p>You have no active or upcoming assignments of this type.</p>
                </div>
            )}
        </div>
      );
  }

  if (!dashboardData) {
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

       <div id="tour-step-main-tools" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-12">
            <Link href="/employee/fleet-check" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Truck className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Vehicle Inspections
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/snow-routes" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Route className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Snow Routes
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/my-tasks" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <ClipboardList className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    My Tasks
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/time-off" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <CalendarPlus className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Time Off
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/submit-expense" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Receipt className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Submit Expense
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/company-documents" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Company Docs
                  </CardTitle>
                </Card>
            </Link>
            <Link href="/employee/personal-documents" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <FileBadge className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl font-headline">
                    Personal Docs
                  </CardTitle>
                </Card>
            </Link>
        </div>

        <Card id="tour-step-job-board" className="mb-12">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">My Assignments</CardTitle>
                <CardDescription>Your active and upcoming work assignments.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="excavation" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="excavation">Excavation ({assignedExcavationJobs.length})</TabsTrigger>
                        <TabsTrigger value="snow">Snow ({assignedSnowContracts.length})</TabsTrigger>
                        <TabsTrigger value="concrete">Concrete ({assignedConcreteJobs.length})</TabsTrigger>
                        <TabsTrigger value="misc">Misc. ({assignedMiscJobs.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="excavation" className="mt-4">{renderJobBoard(assignedExcavationJobs, 'excavation')}</TabsContent>
                    <TabsContent value="snow" className="mt-4">{renderJobBoard(assignedSnowContracts, 'snow_removal')}</TabsContent>
                    <TabsContent value="concrete" className="mt-4">{renderJobBoard(assignedConcreteJobs, 'concrete')}</TabsContent>
                    <TabsContent value="misc" className="mt-4">{renderJobBoard(assignedMiscJobs, 'misc')}</TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
            <div id="tour-step-company-calendar" className="lg:col-span-3">
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <CalendarDays className="text-primary" />
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
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl text-center flex flex-col justify-center items-center p-4">
                    <Check className="h-8 w-8 text-primary mb-2" />
                    <p className="text-4xl font-bold"><AnimatedCounter value={employeeTasks.filter(t => t.status === 'completed').length} /></p>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                </Card>
                 <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl text-center flex flex-col justify-center items-center p-4">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <p className="text-4xl font-bold"><AnimatedCounter value={employeeReports.length} /></p>
                    <p className="text-sm text-muted-foreground">Inspections Done</p>
                </Card>
            </div>
        </div>
    </div>
    </>
  );
}
