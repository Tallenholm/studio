'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadInspectionReports } from '@/lib/localStorageService';
import type { InspectionReport } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Brain, CalendarDays, ListChecks, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsListPage() {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setReports(loadInspectionReports().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold flex items-center gap-2">
          <ListChecks className="h-10 w-10 text-primary" />
          Inspection Reports
        </h1>
        <Link href="/pre-trip" passHref>
           <Button>New Inspection</Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-12 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline">No Reports Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              You haven't submitted any inspection reports yet.
            </CardDescription>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/pre-trip" passHref>
              <Button size="lg">Start First Inspection</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                 <CardTitle className="text-xl font-headline capitalize flex items-center gap-2">
                    {report.overallStatus === 'pass' ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
                    {report.type.replace('-', ' ')}
                  </CardTitle>
                  <Badge variant={report.overallStatus === 'pass' ? 'default' : 'destructive'} className={`${report.overallStatus === 'pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-destructive hover:bg-destructive/90'} text-primary-foreground`}>
                    {report.overallStatus?.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-sm pt-1">
                    <CalendarDays className="h-4 w-4"/> {format(new Date(report.date), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-1"><strong>Truck:</strong> {report.truckVin || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mb-1"><strong>Trailer:</strong> {report.trailerVin || 'N/A'}</p>
                <p className="text-sm text-muted-foreground"><strong>Skid Steer:</strong> {report.skidSteerVin || 'N/A'}</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Link href={`/reports/${report.id}`} className='flex-1'>
                  <Button variant="outline" className="w-full" aria-label={`View report ${report.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </Button>
                </Link>
                {report.type === 'pre-trip' && (
                   <Link href={`/reports/${report.id}?analyze=true`} className='flex-1'>
                    <Button className="w-full" aria-label={`Analyze report ${report.id} with AI`}>
                      <Brain className="mr-2 h-4 w-4" /> AI Analysis
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
