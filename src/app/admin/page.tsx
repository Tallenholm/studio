
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Truck, FileText, UserCheck, CalendarDays, Calendar as CalendarIcon, List, Book, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useMemo, useState } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { loadCalendarEvents } from '@/lib/localStorageService';
import { addDays, format, isSameDay } from 'date-fns';


export default function FleetCheckDashboardPage() {
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
        <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <Truck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Fleet Check Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Oversee fleet assets, users, reports, and settings for the Fleet Check app.
        </p>
      </div>

       <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarIcon className="text-primary" />
            Company Calendar
          </CardTitle>
          <CardDescription>
            At-a-glance view of company events, time off, and maintenance schedules. <Link href="/admin/manage-calendar" className="text-primary hover:underline">Click here to manage events.</Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h3 className="text-xl font-semibold">Events for {date ? format(date, 'PPP') : '...'}</h3>
            {selectedDayEvents.length > 0 ? (
                <ul className="space-y-3">
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


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <List className="text-primary" />
              View Reports
            </CardTitle>
            <CardDescription>
              Review all past inspection reports and their AI analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports" passHref>
              <Button className="w-full">Go to Reports</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Truck className="text-primary" />
              Manage Fleet
            </CardTitle>
            <CardDescription>
              View, add, or edit the vehicles and equipment in your fleet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage-fleet" passHref>
              <Button className="w-full">Go to Fleet Management</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Users className="text-primary" />
              Manage Users
            </CardTitle>
            <CardDescription>
              Add, view, and remove employee user accounts and PINs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage-users" passHref>
              <Button className="w-full">Go to User Management</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <LineChart className="text-primary" />
              Advanced Reports
            </CardTitle>
            <CardDescription>
              Analyze trends, component failures, and inspection history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/advanced-reports" passHref>
              <Button className="w-full">Go to Advanced Reports</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Book className="text-primary" />
              Go to Employee Portal
            </CardTitle>
            <CardDescription>
              Access the simplified view for drivers to do their work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/employee" passHref>
              <Button className="w-full">Go to Employee Portal</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <CalendarIcon className="text-primary" />
              Manage Calendar
            </CardTitle>
            <CardDescription>
              Add or remove company events, time off, and schedules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage-calendar" passHref>
              <Button className="w-full">Go to Calendar Management</Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
