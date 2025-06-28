
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a health summary for a fleet asset.
 *
 * The flow synthesizes data from inspection reports and maintenance logs
 * to create a concise, expert summary of the asset's history and potential future issues.
 *
 * @remarks
 * - generateAssetHealthSummary - The main function to trigger the summary flow.
 * - GenerateAssetHealthSummaryInput - The input type for the generateAssetHealthSummary function.
 * - GenerateAssetHealthSummaryOutput - The output type for the generateAssetHealthSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { loadInspectionReports, loadMaintenanceLogs } from '@/lib/localStorageService';
import { format } from 'date-fns';

const GenerateAssetHealthSummaryInputSchema = z.object({
  assetId: z.string().describe("The ID of the asset to analyze."),
});
export type GenerateAssetHealthSummaryInput = z.infer<typeof GenerateAssetHealthSummaryInputSchema>;

const GenerateAssetHealthSummaryOutputSchema = z.string().describe("A natural language summary of the asset's health.");
export type GenerateAssetHealthSummaryOutput = z.infer<typeof GenerateAssetHealthSummaryOutputSchema>;

export async function generateAssetHealthSummary(
  input: GenerateAssetHealthSummaryInput
): Promise<GenerateAssetHealthSummaryOutput> {
  return generateAssetHealthSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssetHealthSummaryPrompt',
  input: {schema: z.object({ inspectionHistory: z.string(), maintenanceHistory: z.string() })},
  output: {schema: GenerateAssetHealthSummaryOutputSchema},
  prompt: `You are a master fleet mechanic and data analyst. Your task is to provide a concise health summary for a piece of equipment based on its inspection and maintenance history.

Analyze the provided data to identify:
- The most common or recurring issues.
- The date and nature of the last major repair or service.
- Any patterns that might suggest an upcoming failure (e.g., repeated failures of the same component).
- An overall assessment of the asset's condition.

Keep your summary brief, professional, and to the point. Focus on actionable insights.

INSPECTION HISTORY (JSON):
{{{inspectionHistory}}}

MAINTENANCE HISTORY (JSON):
{{{maintenanceHistory}}}

Provide your summary as a single string.
`,
});

const generateAssetHealthSummaryFlow = ai.defineFlow(
  {
    name: 'generateAssetHealthSummaryFlow',
    inputSchema: GenerateAssetHealthSummaryInputSchema,
    outputSchema: GenerateAssetHealthSummaryOutputSchema,
  },
  async ({ assetId }) => {
    // Load all data
    const allReports = loadInspectionReports();
    const allLogs = loadMaintenanceLogs();

    // Filter for the specific asset
    const assetReports = allReports.filter(r => r.truckVin === assetId || r.trailerVin === assetId || r.heavyEquipmentVin === assetId);
    const assetLogs = allLogs.filter(l => l.assetId === assetId);
    
    // Sort and stringify for the prompt
    const inspectionHistory = JSON.stringify(assetReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const maintenanceHistory = JSON.stringify(assetLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const {output} = await prompt({ inspectionHistory, maintenanceHistory });
    return output!;
  }
);
