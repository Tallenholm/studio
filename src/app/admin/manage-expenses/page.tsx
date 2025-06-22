
'use client';

import { useState, useEffect } from 'react';
import { loadExpenseReports, saveExpenseReports } from '@/lib/localStorageService';
import type { ExpenseReport } from '@/lib/types';
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
import { Coins, Loader2, Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ManageExpensesPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setReports(loadExpenseReports().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const updateReportStatus = (reportId: string, status: 'approved' | 'denied') => {
    const updatedReports = reports.map(req => {
      if (req.id === reportId) {
        return { ...req, status };
      }
      return req;
    });

    setReports(updatedReports);
    saveExpenseReports(updatedReports);
    
    toast({
        title: `Expense ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `The expense report has been ${status}.`,
    });
  };

  const getStatusBadgeVariant = (status: ExpenseReport['status']) => {
      switch (status) {
          case 'approved': return 'default';
          case 'denied': return 'destructive';
          case 'pending': return 'secondary';
          default: return 'outline';
      }
  }

  const getCategoryLabel = (category: ExpenseReport['category']) => {
      return category.charAt(0).toUpperCase() + category.slice(1);
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Expense Reports...</p>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const pastReports = reports.filter(r => r.status !== 'pending');
  
  const renderReportTable = (reqs: ExpenseReport[], title: string) => (
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
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reqs.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.employeeName}</TableCell>
                                    <TableCell>{format(new Date(req.date), 'PPP')}</TableCell>
                                    <TableCell>${req.amount.toFixed(2)}</TableCell>
                                    <TableCell>{getCategoryLabel(req.category)}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs">{req.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(req.status)} className={req.status === 'approved' ? 'bg-green-600' : ''}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="icon" asChild>
                                                <Link href={req.receiptDataUri} target="_blank" rel="noopener noreferrer">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {req.status === 'pending' && (
                                                <>
                                                    <Button variant="outline" size="icon" onClick={() => updateReportStatus(req.id, 'approved')}>
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => updateReportStatus(req.id, 'denied')}>
                                                        <X className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
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
                <Coins className="h-8 w-8 text-primary" />
                Manage Expense Reports
            </CardTitle>
            <CardDescription>Review, approve, or deny employee expense submissions.</CardDescription>
        </CardHeader>
       </Card>

        {renderReportTable(pendingReports, 'Pending Reports')}
        {renderReportTable(pastReports, 'Reviewed Reports')}
    </div>
  );
}
