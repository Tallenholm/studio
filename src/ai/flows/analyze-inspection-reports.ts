
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing inspection reports to detect anomalies.
 *
 * The flow uses AI to compare current inspection reports against past reports to identify potential
 * maintenance issues or procedural inconsistencies.  It determines if anomalies merit mechanic intervention,
 * or if a report may require changes to procedure.
 *
 * @remarks
 * - analyzeInspectionReports - The main function to trigger the analysis flow.
 * - AnalyzeInspectionReportsInput - The input type for the analyzeInspectionReports function.
 * - AnalyzeInspectionReportsOutput - The output type for the analyzeInspectionReports function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeInspectionReportsInputSchema = z.object({
  currentReport: z
    .string()
    .describe('The current inspection report data in JSON format.'),
  pastReports: z
    .array(z.string())
    .describe('An array of past inspection reports in JSON format.'),
  vehicleIdentificationNumber: z
    .string()
    .describe(
      'The Vehicle Identification Number (VIN) of the equipment being inspected.'
    ),
});
export type AnalyzeInspectionReportsInput = z.infer<
  typeof AnalyzeInspectionReportsInputSchema
>;

const AnalyzeInspectionReportsOutputSchema = z.object({
  anomaliesDetected: z
    .boolean()
    .describe('Whether any anomalies were detected in the current report.'),
  anomalySummary: z
    .string()
    .describe(
      'A summary of the detected anomalies, including potential causes and recommended actions.'
    ),
  requiresIntervention: z
    .boolean()
    .describe(
      'Whether the detected anomalies require immediate mechanic intervention.'
    ),
  requiresProcedureChange: z
    .boolean()
    .describe(
      'Whether the inspection procedure needs to be reviewed and potentially changed based on the anomalies.'
    ),
});
export type AnalyzeInspectionReportsOutput = z.infer<
  typeof AnalyzeInspectionReportsOutputSchema
>;

export async function analyzeInspectionReports(
  input: AnalyzeInspectionReportsInput
): Promise<AnalyzeInspectionReportsOutput> {
  return analyzeInspectionReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInspectionReportsPrompt',
  input: {schema: AnalyzeInspectionReportsInputSchema},
  output: {schema: AnalyzeInspectionReportsOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing vehicle inspection reports for anomalies.

Your task is to identify any significant deviations or inconsistencies in the current report compared to the past reports for the same vehicle. Consider factors like unexpected component failures, unusual patterns, or deviations from expected values.

Based on your analysis, provide a concise summary, determine if the anomalies require immediate mechanic intervention, and suggest if the inspection procedure itself may need changes.

Vehicle Identification Number (VIN): {{{vehicleIdentificationNumber}}}

Current Inspection Report (JSON):
{{#if currentReport}}{{{currentReport}}}{{else}}No current report provided{{/if}}

Past Inspection Reports (JSON Array):
{{#if pastReports}}
  {{#each pastReports}}
- {{{this}}}
  {{/each}}
{{else}}No past reports provided{{/if}}

Please provide your analysis in the structured output format defined.`,
});

const analyzeInspectionReportsFlow = ai.defineFlow(
  {
    name: 'analyzeInspectionReportsFlow',
    inputSchema: AnalyzeInspectionReportsInputSchema,
    outputSchema: AnalyzeInspectionReportsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
