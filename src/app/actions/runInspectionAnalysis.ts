
'use server';

import { analyzeInspectionReports as runAnalysisFlow } from '@/ai/flows/analyze-inspection-reports';
import { getInspectionReportById, updateInspectionReport } from '@/lib/firestoreService';
import type { AnalyzeInspectionReportsOutput } from '@/lib/types';

interface RunInspectionAnalysisParams {
  reportId: string;
}

/**
 * A Server Action that invokes an AI flow to analyze a single inspection report
 * against the asset's historical data to find anomalies.
 * The result is then saved back to the report document.
 */
export async function runInspectionAnalysis(
  { reportId }: RunInspectionAnalysisParams
): Promise<AnalyzeInspectionReportsOutput> {
  const report = await getInspectionReportById(reportId);
  if (!report) {
    throw new Error('Inspection report not found.');
  }

  const analysisResult = await runAnalysisFlow({ report });

  // Save the analysis result back to the Firestore document
  await updateInspectionReport(reportId, { anomalyReport: analysisResult });

  return analysisResult;
}
