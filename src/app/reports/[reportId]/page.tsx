
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getInspectionReportById, getInspectionReports, updateInspectionReport, getWorkOrders, addWorkOrder, getFleetAssets } from '@/lib/firestoreService';
import type { InspectionReport, WorkOrder } from '@/lib/types';
import ReportDisplayComponent from '@/components/report/ReportDisplayComponent';
// import { analyzeInspectionReports, AnalyzeInspectionReportsInput } from '@/ai/flows/analyze-inspection-reports';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Mock types
type AnalyzeInspectionReportsInput = any;

export default function ReportDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = params.reportId as string;
  const { toast } = useToast();

  const [report, setReport] = useState<InspectionReport | null | undefined>(undefined); // undefined for loading, null for not found
  const [hasWorkOrder, setHasWorkOrder] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      const fetchReport = async () => {
        setIsLoading(true);
        const loadedReport = await getInspectionReportById(reportId);
        setReport(loadedReport);
        
        if (loadedReport) {
            const workOrders = await getWorkOrders();
            setHasWorkOrder(workOrders.some(wo => wo.reportId === reportId));

            // Check if AI analysis should be triggered on load
            if (loadedReport.type === 'pre-trip' && !loadedReport.anomalyReport && searchParams.get('analyze') === 'true') {
                handleAnalyzeReport(loadedReport);
            }
        }
        setIsLoading(false);
      }
      fetchReport();
    }
  }, [reportId, searchParams]);

  const handleAnalyzeReport = async (currentReportToAnalyze?: InspectionReport) => {
    const reportToUse = currentReportToAnalyze || report;
    if (!reportToUse || reportToUse.type !== 'pre-trip') {
      toast({ title: 'Analysis Error', description: 'AI analysis is only available for pre-trip reports.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
    //   const allReports = await getInspectionReports();
    //   const pastReportsForVin = allReports
    //     .filter(r => r.truckVin === reportToUse.truckVin && r.id !== reportToUse.id && r.type === 'pre-trip')
    //     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    //     .slice(0, 5) 
    //     .map(r => JSON.stringify(r));

    //   const aiInput: AnalyzeInspectionReportsInput = {
    //     currentReport: JSON.stringify(reportToUse),
    //     pastReports: pastReportsForVin,
    //     vehicleIdentificationNumber: reportToUse.truckVin || reportToUse.trailerVin || reportToUse.heavyEquipmentVin || 'UNKNOWN_VIN',
    //   };

    //   const analysisResult = await analyzeInspectionReports(aiInput);

    //   const updatedReport = { ...reportToUse, anomalyReport: analysisResult };
    //   await updateInspectionReport(reportToUse.id, { anomalyReport: analysisResult });
    //   setReport(updatedReport);

      toast({
        title: 'AI Analysis Disabled',
        description: 'The AI analysis feature is temporarily unavailable.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast({
        title: 'AI Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during AI analysis.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!report) return;

    const failedItems = report.sections
      .flatMap(sec => sec.items)
      .filter(item => item.status === 'fail');

    if (failedItems.length === 0) {
      toast({ title: 'No action needed', description: 'Cannot create a work order for a report with no failed items.' });
      return;
    }

    const issueDescription = failedItems.map(item => `${item.name}: ${item.notes || 'No notes provided.'}`).join('\n');
    
    const allAssets = await getFleetAssets();
    const assetVin = report.truckVin || report.trailerVin || report.heavyEquipmentVin || 'N/A';
    const asset = allAssets.find(a => a.vin === assetVin);
    const assetName = asset ? asset.name : 'Unknown Asset';

    const newWorkOrder: Omit<WorkOrder, 'id'> = {
      reportId: report.id,
      assetId: asset ? asset.id : 'unknown', // Use the asset ID from Firestore
      assetName: assetName,
      dateCreated: new Date().toISOString(),
      reportedBy: report.employeeName || 'Unknown',
      status: 'open',
      issueDescription: issueDescription,
    };
    
    await addWorkOrder(newWorkOrder);
    setHasWorkOrder(true);
    toast({ title: 'Work Order Created', description: 'A new work order has been generated.' });
    router.push('/admin/manage-work-orders');
  };
  
  if (isLoading || report === undefined) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Report Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            The inspection report you are looking for does not exist or could not be loaded.
          </p>
          <Link href="/reports">
            <Button variant="outline">Back to Reports List</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ReportDisplayComponent 
        report={report} 
        onAnalyze={report.type === 'pre-trip' ? () => handleAnalyzeReport() : undefined} 
        isAnalyzing={isAnalyzing} 
        onCreateWorkOrder={handleCreateWorkOrder}
        hasWorkOrder={hasWorkOrder}
      />
    </div>
  );
}
