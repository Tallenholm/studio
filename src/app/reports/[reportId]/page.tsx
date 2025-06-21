
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { loadInspectionReportById, loadInspectionReports, saveInspectionReport } from '@/lib/localStorageService';
import type { InspectionReport } from '@/lib/types';
import ReportDisplayComponent from '@/components/report/ReportDisplayComponent';
import { analyzeInspectionReports, AnalyzeInspectionReportsInput } from '@/ai/flows/analyze-inspection-reports';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ReportDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.reportId as string;
  const { toast } = useToast();

  const [report, setReport] = useState<InspectionReport | null | undefined>(undefined); // undefined for loading, null for not found
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (reportId) {
      const loadedReport = loadInspectionReportById(reportId);
      setReport(loadedReport);
      
      // Check if AI analysis should be triggered on load
      if (loadedReport && loadedReport.type === 'pre-trip' && !loadedReport.anomalyReport && searchParams.get('analyze') === 'true') {
        handleAnalyzeReport(loadedReport);
      }
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
      // For "pastReports", load all reports and filter for the same truck VIN, excluding the current one, and take latest N (e.g. 5)
      const allReports = loadInspectionReports();
      const pastReportsForVin = allReports
        .filter(r => r.truckVin === reportToUse.truckVin && r.id !== reportToUse.id && r.type === 'pre-trip')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5) // Limit to 5 past reports for brevity
        .map(r => JSON.stringify(r)); // Convert to JSON strings as expected by AI flow

      const aiInput: AnalyzeInspectionReportsInput = {
        currentReport: JSON.stringify(reportToUse),
        pastReports: pastReportsForVin,
        vehicleIdentificationNumber: reportToUse.truckVin || 'UNKNOWN_VIN',
      };

      const analysisResult = await analyzeInspectionReports(aiInput);

      const updatedReport = { ...reportToUse, anomalyReport: analysisResult };
      saveInspectionReport(updatedReport);
      setReport(updatedReport);

      toast({
        title: 'AI Analysis Complete',
        description: 'Anomaly detection results are now available.',
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
  
  if (!isMounted || report === undefined) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading report details...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="max-w-lg mx-auto mt-10 text-center bg-card/60 backdrop-blur-xl border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out">
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
      />
    </div>
  );
}
