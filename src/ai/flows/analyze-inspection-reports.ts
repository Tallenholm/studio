
'use server';

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';
import { getReportsByVin } from '@/lib/firestoreService';
import type { InspectionReport } from '@/lib/types';
import { format } from 'date-fns';

export const AnalyzeInspectionReportsInputSchema = z.object({
  report: z.custom<InspectionReport>(),
});
export type AnalyzeInspectionReportsInput = z.infer<typeof AnalyzeInspectionReportsInputSchema>;

export const AnalyzeInspectionReportsOutputSchema = z.object({
  anomaliesDetected: z.boolean().describe('Whether any unusual patterns or anomalies were detected.'),
  anomalySummary: z.string().describe('A concise, one-sentence summary of the findings.'),
  requiresIntervention: z.boolean().describe('True if the detected anomalies suggest immediate mechanical attention is required.'),
  requiresProcedureChange: z.boolean().describe('True if the findings suggest a potential issue with operator procedures or training.'),
});
export type AnalyzeInspectionReportsOutput = z.infer<typeof AnalyzeInspectionReportsOutputSchema>;


const analysisFlow = ai.defineFlow(
  {
    name: 'analyzeInspectionReportsFlow',
    inputSchema: AnalyzeInspectionReportsInputSchema,
    outputSchema: AnalyzeInspectionReportsOutputSchema,
  },
  async ({ report }) => {
    const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
    if (!vin) {
      return {
        anomaliesDetected: false,
        anomalySummary: "No vehicle VIN found in the report.",
        requiresIntervention: false,
        requiresProcedureChange: false,
      }
    }
    
    // Fetch historical reports programmatically instead of using a tool
    const historicalReports = await getReportsByVin(vin);
    const historicalReportsText = historicalReports
      .map(r => `- Date: ${format(new Date(r.date), 'yyyy-MM-dd')}, Status: ${r.overallStatus}, Failed Items: ${r.sections.flatMap(s => s.items).filter(i => i.status === 'fail').map(i => i.name).join(', ') || 'None'}`)
      .join('\n');


    const prompt = `You are an expert fleet maintenance analyst. Your task is to analyze a new vehicle inspection report in the context of its recent history to detect anomalies.

    Analyze the provided new report and compare it against the historical reports for the same vehicle.
    - Look for recurring failures. Is the same item failing repeatedly across different reports?
    - Look for sudden changes. Is an item failing now that has always passed before?
    - Look for patterns of neglect. Are "low fluid" or "dirty" type issues common? This might suggest a need for procedural changes or operator training.
    - If there are no historical failures and the new report is clean, that's a good sign.

    Based on your analysis, determine if any anomalies are detected.
    - If a specific part is failing repeatedly, it likely requires mechanic intervention.
    - If issues are related to cleanliness, fluid levels, or simple checks, it may require a change in operator procedure.
    
    Provide a concise summary and set the boolean flags appropriately.

    Current Report to Analyze:
    - VIN: ${vin}
    - Date: ${format(new Date(report.date), 'yyyy-MM-dd')}
    - Overall Status: ${report.overallStatus}
    - Failed Items: ${report.sections.flatMap(s => s.items).filter(i => i.status === 'fail').map(i => i.name).join(', ') || 'None'}

    Historical Reports (Last 6 Months):
    ${historicalReportsText || "No historical reports found."}
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: DEFAULT_MODEL,
      output: {
        format: 'json',
        schema: AnalyzeInspectionReportsOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('AI response did not include a valid analysis object.');
    }
    return output;
  }
);


export async function analyzeInspectionReports(input: AnalyzeInspectionReportsInput): Promise<AnalyzeInspectionReportsOutput> {
  return analysisFlow(input);
}
