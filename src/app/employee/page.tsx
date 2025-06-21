
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Truck, User, Calendar as CalendarIcon, CalendarDays, CalendarPlus, Loader2, FileText, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { CalendarEvent } from '@/lib/types';
import { loadCalendarEvents } from '@/lib/localStorageService';
import { isSameDay, format } from 'date-fns';


export default function EmployeeHubPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

   useEffect(() => {
    setIsMounted(true);
    setEvents(loadCalendarEvents());
  }, []);

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
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-headline font-bold mb-4">Welcome, {user?.name || 'Employee'}!</h1>
        <p className="text-2xl text-muted-foreground">
          Your central hub for work tools.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
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
                <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Truck className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Fleet Check
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Daily vehicle inspections.
                  </CardDescription>
                </Card>
              </Link>
              <Link href="/employee/time-clock" passHref>
                <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <Clock className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Time Clock
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Clock in and out for shifts.
                  </CardDescription>
                </Card>
              </Link>
              <Link href="/employee/time-off" passHref>
                <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
                  <CalendarPlus className="h-16 w-24 text-primary mx-auto mb-4" />
                  <CardTitle className="text-2xl font-headline">
                    Time Off
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Request time off.
                  </CardDescription>
                </Card>
              </Link>
                <Link href="/reports" passHref>
                <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
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
                <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer">
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
  );
}
