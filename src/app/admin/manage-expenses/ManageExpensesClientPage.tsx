
'use client';

import { useState } from 'react';
import type { ExpenseReport } from '@/lib/types';
import { updateExpenseReport } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Coins, Check, X, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

interface ManageExpensesClientPageProps {
  initialReports: ExpenseReport[];
}

export default function ManageExpensesClientPage({ initialReports }: ManageExpensesClientPageProps) {
  const [reports, setReports] = useState<ExpenseReport[]>(initialReports);
  const { toast } = useToast();

  const handleUpdateStatus = async (reportId: string, status: 'approved' | 'denied') => {
    await updateExpenseReport(reportId, { status });
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    toast({ title: `Expense ${status}`, description: 'The expense report has been updated.' });
  };
  
  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status !== 'pending').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadgeVariant = (status: ExpenseReport['status']) => {
    switch (status) {
        case 'approved': return 'default';
        case 'denied': return 'destructive';
        case 'pending': return 'secondary';
    }
  };
  
  const renderTable = (data: ExpenseReport[]) => (
    <div className="border rounded-md bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.map(report => (
            <TableRow key={report.id}>
              <TableCell>{format(parseISO(report.date), 'PP')}</TableCell>
              <TableCell>{report.employeeName}</TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">{report.description}</TableCell>
              <TableCell>${report.amount.toFixed(2)}</TableCell>
              <TableCell><Badge variant={getStatusBadgeVariant(report.status)} className={cn(report.status === 'approved' && 'bg-primary')}>{report.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                    <Link href={report.receiptPhotoUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Eye/></Button></Link>
                    {report.status === 'pending' && (
                        <>
                            <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(report.id, 'approved')}><Check className="text-primary"/></Button>
                            <Button variant="outline" size="icon" className="ml-2" onClick={() => handleUpdateStatus(report.id, 'denied')}><X className="text-destructive"/></Button>
                        </>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Manage Expenses" description="Review, approve, or deny employee expense submissions." icon={Coins} />
      <div className="mt-8">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({reviewedReports.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            {pendingReports.length > 0 ? renderTable(pendingReports) : <EmptyState icon={Coins} title="No Pending Expenses" message="All caught up!"/>}
          </TabsContent>
          <TabsContent value="reviewed" className="mt-4">
             {reviewedReports.length > 0 ? renderTable(reviewedReports) : <EmptyState icon={Coins} title="No Reviewed Expenses" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
