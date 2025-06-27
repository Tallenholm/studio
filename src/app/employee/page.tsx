
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, User, Calendar as CalendarIcon, CalendarDays, CalendarPlus, Loader2, FileText, Bell, BookOpen, ClipboardList, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarEvent } from '@/lib/types';
import { loadCalendarEvents } from '@/lib/localStorageService';
import { isSameDay, format } from 'date-fns';
import GuidedTour from '@/components/common/GuidedTour';

const employeeTourSteps = [
    { title: "Welcome to the Employee Hub!", content: "This is your one-stop shop for daily tasks and company resources. Let's take a quick tour." },
    { title: "Company Calendar", content: "The Company Calendar shows you all company-wide events and your approved time off. Click any date to see what's scheduled." },
    { title: "Your Main Tools", content: "The cards on the right are your main tools. Here you can start vehicle inspections ('Fleet Check'), request time off, complete tasks, submit expenses, and more." },
    { title: "Sidebar Navigation", content: "You can also access all these tools from the sidebar menu on the left. New notifications will appear with a badge, so keep an eye out." },
    { title: "Get Help", content: "If you ever need a reminder, click the 'Help & Support' link at the bottom of the sidebar for a full guide to all features. You're all set!" },
];

export default function EmployeeHubPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);

   useEffect(() => {
    setIsMounted(true);
    const hasViewedTour = localStorage.getItem('hasViewedTour_employee');
    if (searchParams.get('tour') === 'true' && !hasViewedTour) {
        setIsTourOpen(true);
    }
    setEvents(loadCalendarEvents());
  }, [searchParams]);

  const eventDates = useMemo(() => {
    return events.map(event => new Date(event.date));
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!date) return [];
    return events.filter(event => isSameDay(new Date(event.date), date));
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
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold mb-4">Welcome, {user?.name || 'Employee'}!</h1>
        <p className="text-2xl text-muted-foreground">
          Your central hub for work tools.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <Link href="/employee/fleet-check" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Truck className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Fleet Check
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Daily vehicle inspections.
                  </CardDescription>
                </Card>
              </Link>
              <Link href="/employee/time-off" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <CalendarPlus className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Time Off
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Request time off.
                  </CardDescription>
                </Card>
              </Link>
              <Link href="/employee/my-tasks" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <ClipboardList className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    View & complete assigned tasks.
                  </CardDescription>
                </Card>
              </Link>
              <Link href="/employee/submit-expense" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Receipt className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Submit Expense
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Upload receipts for reimbursement.
                  </CardDescription>
                </Card>
              </Link>
               <Link href="/employee/vehicle-documents" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <BookOpen className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Vehicle Documents
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Insurance, registration, etc.
                  </CardDescription>
                </Card>
              </Link>
                <Link href="/reports" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <FileText className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    My Reports
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    View your past inspections.
                  </CardDescription>
                </Card>
              </Link>
               <Link href="/notifications" passHref>
                <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Bell className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    View messages and alerts.
                  </CardDescription>
                </Card>
              </Link>
          </div>
       </div>
    </div>
    </>
  );
}
