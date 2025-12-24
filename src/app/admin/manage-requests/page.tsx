
'use client';

import { useState, useEffect } from 'react';
import { getTimeOffRequests, updateTimeOffRequest, addCalendarEvent } from '@/lib/firestoreService';
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
import { cn } from '@/lib/utils';

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchRequests() {
        setIsLoading(true);
        try {
            const loadedRequests = await getTimeOffRequests();
            setRequests(loadedRequests.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load time off requests.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchRequests();
  }, [toast]);

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'denied') => {
    const originalRequests = [...requests];
    const requestToUpdate = originalRequests.find(req => req.id === requestId);
    if (!requestToUpdate) return;
    
    const updatedRequest = { ...requestToUpdate, status };
    const updatedRequests = requests.map(req => (req.id === requestId ? updatedRequest : req));
    setRequests(updatedRequests);

    try {
        await updateTimeOffRequest(requestId, { status });
        
        if (status === 'approved') {
            const interval = { start: parseISO(updatedRequest.startDate), end: parseISO(updatedRequest.endDate) };
            if (interval.start > interval.end) throw new Error("Start date cannot be after end date.");

            const datesInRange = eachDayOfInterval(interval);

            const eventPromises = datesInRange.map((date, index) => {
                const newEvent: Omit<CalendarEvent, 'id'> = {
                    date: format(date, 'yyyy-MM-dd'), 
                    title: `Time Off: ${updatedRequest.employeeName}`,
                    type: 'time-off',
                    description: updatedRequest.reason,
                };
                return addCalendarEvent(newEvent, `time-off-${updatedRequest.id}-${index}`);
            });
            await Promise.all(eventPromises);
            toast({ title: `Request Approved`, description: `The request has been approved and added to the calendar.` });
        } else {
             toast({ title: `Request Denied`, description: `The time off request has been denied.` });
        }
    } catch (error) {
        console.error("Error updating request status:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the request.' });
        setRequests(originalRequests); // Revert UI on failure
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

  if (isLoading) {
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
                                    <TableCell>{format(parseISO(req.startDate), 'PPP')} - {format(parseISO(req.endDate), 'PPP')}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs">{req.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(req.status)} className={cn(req.status === 'approved' && 'bg-primary')}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(req.id, 'approved')}>
                                                    <Check className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(req.id, 'denied')}>
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
       <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
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
