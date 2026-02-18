
'use client';

import { useState } from 'react';
import type { TimeOffRequest } from '@/lib/types';
import { updateTimeOffRequest } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

interface ManageRequestsClientPageProps {
  initialPendingRequests: TimeOffRequest[];
  initialReviewedRequests: TimeOffRequest[];
}

export default function ManageRequestsClientPage({ initialPendingRequests, initialReviewedRequests }: ManageRequestsClientPageProps) {
  const [pendingRequests, setPendingRequests] = useState<TimeOffRequest[]>(initialPendingRequests);
  const [reviewedRequests, setReviewedRequests] = useState<TimeOffRequest[]>(initialReviewedRequests);
  const { toast } = useToast();

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'denied') => {
    await updateTimeOffRequest(requestId, { status });
    const requestToMove = pendingRequests.find(r => r.id === requestId);
    if (requestToMove) {
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      setReviewedRequests(prev => [{ ...requestToMove, status }, ...prev]);
    }
    toast({ title: `Request ${status}`, description: 'The time off request has been updated.' });
  };
  
  const getStatusBadgeVariant = (status: TimeOffRequest['status']) => {
    switch (status) {
        case 'approved': return 'default';
        case 'denied': return 'destructive';
        case 'pending': return 'secondary';
    }
  };
  
  const renderTable = (data: TimeOffRequest[]) => (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Dates</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead>{data[0]?.status === 'pending' && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
        <TableBody>
          {data.map(request => (
            <TableRow key={request.id}>
              <TableCell>{request.employeeName}</TableCell>
              <TableCell>{format(parseISO(request.startDate), 'PP')} - {format(parseISO(request.endDate), 'PP')}</TableCell>
              <TableCell className="text-muted-foreground">{request.reason}</TableCell>
              <TableCell><Badge variant={getStatusBadgeVariant(request.status)} className={cn(request.status === 'approved' && 'bg-primary')}>{request.status}</Badge></TableCell>
              {request.status === 'pending' && (
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(request.id, 'approved')}><Check className="text-primary"/></Button>
                  <Button variant="outline" size="icon" className="ml-2" onClick={() => handleUpdateStatus(request.id, 'denied')}><X className="text-destructive"/></Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Manage Time Off Requests" description="Approve or deny employee requests for time off." icon={ClipboardCheck} />
      <div className="mt-8">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewedRequests.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            {pendingRequests.length > 0 ? renderTable(pendingRequests) : <EmptyState icon={ClipboardCheck} title="No Pending Requests" message="All caught up!"/>}
          </TabsContent>
          <TabsContent value="reviewed" className="mt-4">
             {reviewedRequests.length > 0 ? renderTable(reviewedRequests) : <EmptyState icon={ClipboardCheck} title="No Reviewed Requests" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
