
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Truck, CalendarDays, Loader2, Calendar as CalendarIcon, Cog, ClipboardList, Coins, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useMemo, useState } from 'react';
import type { CalendarEvent, InspectionReport, FleetAsset } from '@/lib/types';
import { loadCalendarEvents, loadInspectionReports, loadFleetAssets } from '@/lib/localStorageService';
import { isSameDay, format } from 'date-fns';


export default function FleetCheckDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [failedReports, setFailedReports] = useState<InspectionReport[]>([]);
  const [allAssets, setAllAssets] = useState<FleetAsset[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setEvents(loadCalendarEvents());
    
    const reports = loadInspectionReports();
    const assets = loadFleetAssets();
    setAllAssets(assets);
    
    const recentFailed = reports
        .filter(r => r.overallStatus === 'fail')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Show latest 5 issues to keep it clean
    setFailedReports(recentFailed);

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

       <Card className="mb-8 border-destructive/50 shadow-xl bg-destructive/5 hover:shadow-destructive/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-destructive">
              <AlertTriangle />
              Recent Issues Requiring Attention
            </CardTitle>
            <CardDescription>
              The following inspections were submitted with failed items. Please review them promptly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {failedReports.length > 0 ? (
              <ul className="space-y-3">
                {failedReports.map(report => {
                  const asset = allAssets.find(a => a.vin === (report.truckVin || report.trailerVin || report.heavyEquipmentVin));
                  return (
                    <li key={report.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-md border bg-card">
                      <div>
                        <p className="font-semibold">{asset?.name || report.truckVin || 'Unknown Asset'}</p>
                        <p className="text-sm text-muted-foreground">
                          Failed {report.type.replace('-', ' ')} inspection by {report.employeeName || 'N/A'} on {format(new Date(report.date), 'PPP')}
                        </p>
                      </div>
                      <Link href={`/reports/${report.id}`} passHref>
                        <Button variant="outline" size="sm">View Report</Button>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-6 flex items-center justify-center gap-4 border-2 border-dashed rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold text-lg text-foreground">No Failed Inspections</p>
                  <p>All systems are currently operational.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


       <Card className="mb-8 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
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
