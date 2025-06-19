'use client';

import type { InspectionReport, CompletedInspectionItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Truck, Box, Construction, CalendarDays, Fingerprint, Brain, ThumbsUp, AlertOctagon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { CHECKLIST_DATA } from '@/lib/data';

interface ReportDisplayProps {
  report: InspectionReport;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

const getVehicleIcon = (vehicleType: string) => {
  if (vehicleType === 'truck') return <Truck className="h-5 w-5" />;
  if (vehicleType === 'trailer') return <Box className="h-5 w-5" />;
  if (vehicleType === 'skidSteer') return <Construction className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const getItemIcon = (vehicleType: string, itemId: string) => {
  const sectionData = CHECKLIST_DATA.find(s => s.id === vehicleType);
  const itemData = sectionData?.items.find(i => i.id === itemId);
  return itemData ? <itemData.Icon className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />;
};


export default function ReportDisplayComponent({ report, onAnalyze, isAnalyzing }: ReportDisplayProps) {
  const overallStatusColor = report.overallStatus === 'pass' ? 'text-green-600' : 'text-red-600';
  const overallStatusBgColor = report.overallStatus === 'pass' ? 'bg-green-100' : 'bg-red-100';

  return (
    <Card className="shadow-xl w-full">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-headline capitalize flex items-center gap-2">
              <FileText className={`h-8 w-8 ${overallStatusColor}`} />
              {report.type.replace('-', ' ')} Inspection Report
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(new Date(report.date), 'PPPp')}
            </CardDescription>
          </div>
          <Badge variant={report.overallStatus === 'pass' ? 'default' : 'destructive'} 
                 className={`px-4 py-2 text-lg ${report.overallStatus === 'pass' ? 'bg-green-500' : 'bg-red-500'} text-primary-foreground`}>
            Overall: {report.overallStatus?.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 font-headline flex items-center gap-2"><Fingerprint className="text-primary h-6 w-6" />Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <p><strong className="font-medium">Truck VIN:</strong> {report.truckVin || 'N/A'}</p>
            <p><strong className="font-medium">Trailer VIN:</strong> {report.trailerVin || 'N/A'}</p>
            <p><strong className="font-medium">Skid Steer VIN:</strong> {report.skidSteerVin || 'N/A'}</p>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 font-headline">Inspection Details</h3>
          <Accordion type="multiple" defaultValue={report.sections.map(s => s.vehicleType)} className="w-full">
            {report.sections.map((section) => (
              <AccordionItem value={section.vehicleType} key={section.vehicleType} className="border rounded-lg mb-2 bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 text-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {getVehicleIcon(section.vehicleType)}
                    {section.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 border-t">
                  <ul className="space-y-3">
                    {section.items.map((item: CompletedInspectionItem) => (
                      <li key={item.itemId} className={`p-3 rounded-md border ${item.status === 'pass' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            {getItemIcon(section.vehicleType, item.itemId)}
                            {item.name}
                          </span>
                          <Badge variant={item.status === 'pass' ? 'default' : 'destructive'} className={item.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        {item.status === 'fail' && item.notes && (
                          <p className="text-sm text-red-700 mt-1 pl-7"><strong>Notes:</strong> {item.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {report.type === 'pre-trip' && (
          <>
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-3 font-headline flex items-center gap-2"><Brain className="text-primary h-6 w-6" />AI Anomaly Detection</h3>
              {report.anomalyReport ? (
                <Card className={report.anomalyReport.requiresIntervention || report.anomalyReport.requiresProcedureChange ? 'border-accent bg-accent/10' : 'border-green-500 bg-green-500/10'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {report.anomalyReport.requiresIntervention || report.anomalyReport.requiresProcedureChange ? 
                        <AlertOctagon className="text-accent h-6 w-6" /> : 
                        <ThumbsUp className="text-green-600 h-6 w-6" />}
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Anomalies Detected:</strong> {report.anomalyReport.anomaliesDetected ? 'Yes' : 'No'}</p>
                    <p><strong>Summary:</strong> {report.anomalyReport.anomalySummary}</p>
                    <p><strong>Requires Mechanic Intervention:</strong> {report.anomalyReport.requiresIntervention ? <span className="font-bold text-accent">Yes</span> : 'No'}</p>
                    <p><strong>Requires Procedure Change:</strong> {report.anomalyReport.requiresProcedureChange ? <span className="font-bold text-accent">Yes</span> : 'No'}</p>
                  </CardContent>
                </Card>
              ) : onAnalyze ? (
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">No AI analysis has been run for this report yet.</p>
                  <Button onClick={onAnalyze} disabled={isAnalyzing} className="bg-primary hover:bg-primary/90">
                    {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze with AI
                  </Button>
                </div>
              ) : (
                 <p className="text-muted-foreground">AI analysis is not available for this report type or context.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end">
        <Button variant="outline" onClick={() => window.print()} aria-label="Print Report">
          <FileText className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </CardFooter>
    </Card>
  );
}
