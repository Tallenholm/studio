
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadTimeOffRequests, saveTimeOffRequests, loadCalendarEvents, saveCalendarEvents } from '@/lib/localStorageService';
import type { TimeOffRequest, CalendarEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Loader2, Check, X } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setRequests(loadTimeOffRequests().sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
  }, []);

  const updateRequestStatus = (requestId: string, status: 'approved' | 'denied') => {
    let approvedRequest: TimeOffRequest | undefined;
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        const updatedReq = { ...req, status };
        if (status === 'approved') {
            approvedRequest = updatedReq;
        }
        return updatedReq;
      }
      return req;
    });

    setRequests(updatedRequests);
    saveTimeOffRequests(updatedRequests);
    
    if (status === 'approved' && approvedRequest) {
        const requestToProcess = approvedRequest;
        try {
            const calendarEvents = loadCalendarEvents();
            
            const interval = {
                start: parseISO(requestToProcess.startDate),
                end: parseISO(requestToProcess.endDate)
            };

            if (interval.start > interval.end) {
                throw new Error("Start date cannot be after end date.");
            }

            const datesInRange = eachDayOfInterval(interval);

            const newEvents: CalendarEvent[] = datesInRange.map((date, index) => ({
                id: `time-off-${requestToProcess.id}-${index}`,
                date: format(date, 'yyyy-MM-dd'), 
                title: `Time Off: ${requestToProcess.employeeName}`,
                type: 'time-off',
                description: requestToProcess.reason,
            }));
            
            saveCalendarEvents([...calendarEvents, ...newEvents]);

            toast({
                title: `Request Approved`,
                description: `The request has been approved and added to the calendar.`,
            });
        } catch (error) {
            console.error("Failed to update calendar:", error);
            toast({
                variant: 'destructive',
                title: 'Calendar Update Failed',
                description: 'The request was approved, but an error occurred adding it to the calendar.',
            });
        }
    } else {
        toast({
          title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          description: `The time off request has been ${status}.`,
        });
    }
  };

  const getStatusBadgeVariant = (status: TimeOffRequest['status']) => {
      switch (status) {
          case 'approved': return 'default';
          case 'denied': return 'destructive';
          case 'pending': return 'secondary';
          default: return 'outline';
      }
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Time Off Requests...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');
  
  const renderRequestTable = (reqs: TimeOffRequest[], title: string) => (
       <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                 {reqs.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Dates Requested</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reqs.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell>{format(new Date(req.startDate), 'PPP')} - {format(new Date(req.endDate), 'PPP')}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">{req.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(req.status)} className={req.status === 'approved' ? 'bg-green-600' : ''}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="icon" onClick={() => updateRequestStatus(req.id, 'approved')}>
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button variant="outline" size="icon" onClick={() => updateRequestStatus(req.id, 'denied')}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No {title.toLowerCase()} to display.</div>
                )}
            </CardContent>
        </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
       <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                Manage Time Off Requests
            </CardTitle>
            <CardDescription>Approve or deny employee requests for time off. Approved requests will be added to the company calendar.</CardDescription>
        </CardHeader>
       </Card>

        {renderRequestTable(pendingRequests, 'Pending Requests')}
        {renderRequestTable(pastRequests, 'Reviewed Requests')}
    </div>
  );
}
