
'use client';

import type { InspectionReport, CompletedInspectionItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Camera, AlertTriangle, FileText, Truck, Box, Shovel, CalendarDays, Fingerprint, Brain, ThumbsUp, AlertOctagon, Loader2, User, ClipboardEdit } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { CHECKLIST_DATA } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ReportDisplayProps {
  report: InspectionReport;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onCreateWorkOrder?: () => void;
  hasWorkOrder?: boolean;
}

const getVehicleIcon = (vehicleType: string) => {
  if (vehicleType === 'truck') return <Truck className="h-5 w-5" />;
  if (vehicleType === 'trailer') return <Box className="h-5 w-5" />;
  if (vehicleType === 'heavyEquipment') return <Shovel className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const getItemIcon = (vehicleType: string, itemId: string) => {
  const sectionData = CHECKLIST_DATA.find(s => s.id === vehicleType);
  const itemData = sectionData?.items.find(i => i.id === itemId);
  return itemData ? <itemData.Icon className="h-5 w-5 mr-2" /> : <AlertTriangle className="h-5 w-5 mr-2" />;
};


export default function ReportDisplayComponent({ report, onAnalyze, isAnalyzing, onCreateWorkOrder, hasWorkOrder }: ReportDisplayProps) {
  const overallStatusColor = report.overallStatus === 'pass' ? 'text-primary' : 'text-destructive';
  const overallStatusBadgeClass = report.overallStatus === 'pass' ? 'bg-primary' : 'bg-destructive';


  return (
    <Card className="w-full bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-3xl font-headline capitalize flex items-center gap-2">
              <FileText className={`h-8 w-8 ${overallStatusColor}`} />
              {report.type.replace('-', ' ')} Inspection Report
            </CardTitle>
             <CardDescription className="flex items-center gap-2 mt-2 text-sm flex-wrap">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {format(new Date(report.date), 'PPPp')}
              </span>
              {report.employeeName && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{report.employeeName}</span>
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge 
            variant={report.overallStatus === 'pass' ? 'default' : 'destructive'} 
            className={cn(`px-4 py-2 text-lg shrink-0 text-primary-foreground`, overallStatusBadgeClass)}
          >
            Overall: {report.overallStatus?.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 font-headline flex items-center gap-2"><Fingerprint className="text-primary h-6 w-6" />Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <p><strong className="font-medium text-foreground">Truck:</strong> {report.truckVin || 'N/A'}</p>
            <p><strong className="font-medium text-foreground">Trailer:</strong> {report.trailerVin || 'N/A'}</p>
            <p><strong className="font-medium text-foreground">Heavy Equipment:</strong> {report.heavyEquipmentVin || 'N/A'}</p>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 font-headline">Inspection Details</h3>
          <Accordion type="multiple" defaultValue={report.sections.map(s => s.vehicleType)} className="w-full">
            {report.sections.map((section) => (
              <AccordionItem value={section.vehicleType} key={section.vehicleType} className="border rounded-lg mb-2 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <AccordionTrigger className="px-4 py-3 text-lg hover:bg-muted/30 transition-colors data-[state=open]:bg-muted/50">
                  <div className="flex items-center gap-2 font-medium">
                    {getVehicleIcon(section.vehicleType)}
                    {section.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 border-t bg-background/50">
                  <ul className="space-y-3">
                    {section.items.map((item: CompletedInspectionItem) => (
                      <li key={item.itemId} className={`p-3 rounded-md border ${item.status === 'pass' ? 'border-primary/30 bg-primary/10' : 'border-destructive/30 bg-destructive/10'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            {getItemIcon(section.vehicleType, item.itemId)}
                            {item.name}
                          </span>
                          <Badge variant={item.status === 'pass' ? 'default' : 'destructive'} className={cn(item.status === 'pass' && 'bg-primary', 'text-primary-foreground')}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {(item.notes || item.photoDataUri) && (
                            <div className="mt-2 pl-7 flex items-start gap-4">
                                {item.notes && (
                                    <p className={`text-sm ${item.status === 'fail' ? 'text-destructive-foreground font-semibold' : 'text-muted-foreground'} flex-1`}><strong>Notes:</strong> {item.notes}</p>
                                )}
                                {item.photoDataUri && (
                                  <div className="flex-shrink-0">
                                    <Link href={item.photoDataUri} target="_blank" rel="noopener noreferrer" className="block relative group">
                                        <Image
                                            src={item.photoDataUri}
                                            alt={`Photo for ${item.name}`}
                                            width={100}
                                            height={100}
                                            className="rounded-md border-2 border-muted object-cover aspect-square transition-opacity group-hover:opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-6 w-6 text-white"/>
                                        </div>
                                    </Link>
                                  </div>
                                )}
                            </div>
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
                <Card className={`border-2 ${report.anomalyReport.requiresIntervention || report.anomalyReport.requiresProcedureChange ? 'border-destructive bg-destructive/10' : 'border-primary/50 bg-primary/10'} shadow-md`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {report.anomalyReport.requiresIntervention || report.anomalyReport.requiresProcedureChange ? 
                        <AlertOctagon className="text-destructive h-6 w-6" /> : 
                        <ThumbsUp className="text-primary h-6 w-6" />}
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Anomalies Detected:</strong> {report.anomalyReport.anomaliesDetected ? <span className="font-semibold text-destructive">Yes</span> : <span className="font-semibold text-primary">No</span>}</p>
                    <p><strong>Summary:</strong> {report.anomalyReport.anomalySummary}</p>
                    <p><strong>Requires Mechanic Intervention:</strong> {report.anomalyReport.requiresIntervention ? <span className="font-bold text-destructive">Yes</span> : 'No'}</p>
                    <p><strong>Requires Procedure Change:</strong> {report.anomalyReport.requiresProcedureChange ? <span className="font-bold text-destructive">Yes</span> : 'No'}</p>
                  </CardContent>
                </Card>
              ) : onAnalyze ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="mb-4 text-muted-foreground">No AI analysis has been run for this report yet.</p>
                  <Button onClick={onAnalyze} disabled={isAnalyzing} className="text-lg px-6 py-3">
                    {isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                    {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>
                </div>
              ) : (
                 <p className="text-muted-foreground p-6 border-2 border-dashed rounded-lg text-center">AI analysis is not available for this report type or context.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6 flex justify-between items-center">
        {onCreateWorkOrder && report.overallStatus === 'fail' && (
          <Button 
            onClick={onCreateWorkOrder} 
            disabled={hasWorkOrder}
            aria-label="Create Work Order"
          >
            <ClipboardEdit className="mr-2 h-4 w-4" />
            {hasWorkOrder ? 'Work Order Created' : 'Create Work Order'}
          </Button>
        )}
        <div className="flex-grow" />
        <Button variant="outline" onClick={() => window.print()} aria-label="Print Report">
          <FileText className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </CardFooter>
    </Card>
  );
}
