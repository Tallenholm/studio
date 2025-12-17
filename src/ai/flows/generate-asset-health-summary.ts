
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
import { getInspectionReports, getMaintenanceLogs, getFleetAssetById } from '@/lib/firestoreService';


export const GenerateAssetHealthSummaryInputSchema = z.object({
  assetId: z.string().describe("The ID of the asset to summarize."),
});
export type GenerateAssetHealthSummaryInput = z.infer<typeof GenerateAssetHealthSummaryInputSchema>;

export const GenerateAssetHealthSummaryOutputSchema = z.string().describe("A natural language summary of the asset's health.");
export type GenerateAssetHealthSummaryOutput = z.infer<typeof GenerateAssetHealthSummaryOutputSchema>;

export async function generateAssetHealthSummary(
  input: GenerateAssetHealthSummaryInput
): Promise<GenerateAssetHealthSummaryOutput> {
  return generateAssetHealthSummaryFlow(input);
}

const getAssetHistory = ai.defineTool(
    {
        name: 'getAssetHistory',
        description: "Retrieves the recent inspection and maintenance history for a specific fleet asset.",
        inputSchema: z.object({ assetId: z.string() }),
        outputSchema: z.object({
            inspectionHistory: z.string(),
            maintenanceHistory: z.string(),
        }),
    },
    async ({ assetId }) => {
        const [asset, allReports, allLogs] = await Promise.all([
            getFleetAssetById(assetId),
            getInspectionReports(),
            getMaintenanceLogs()
        ]);

        if (!asset) {
            throw new Error(`Asset with ID ${assetId} not found.`);
        }

        const assetReports = allReports.filter(r =>
            r.truckVin === asset.vin ||
            r.trailerVin === asset.vin ||
            r.heavyEquipmentVin === asset.vin
        );

        const assetLogs = allLogs.filter(l => l.assetId === assetId);

        const inspectionHistory = JSON.stringify(
            assetReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
        );
        const maintenanceHistory = JSON.stringify(
            assetLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
        );

        return { inspectionHistory, maintenanceHistory };
    }
);


const prompt = ai.definePrompt({
  name: 'generateAssetHealthSummaryPrompt',
  tools: [getAssetHistory],
  prompt: `You are a master fleet mechanic and data analyst. Your task is to provide a concise health summary for a piece of equipment based on its inspection and maintenance history.

Use the provided tool to fetch the asset's history. Analyze the data to identify:
- The most common or recurring issues.
- The date and nature of the last major repair or service.
- Any patterns that might suggest an upcoming failure (e.g., repeated failures of the same component).
- An overall assessment of the asset's condition.

Keep your summary brief (2-3 sentences), professional, and to the point. Focus on actionable insights.`,
});

const generateAssetHealthSummaryFlow = ai.defineFlow(
  {
    name: 'generateAssetHealthSummaryFlow',
    inputSchema: GenerateAssetHealthSummaryInputSchema,
    outputSchema: GenerateAssetHealthSummaryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt.generate({
        input: {
            question: `Please provide a health summary for asset ${input.assetId}.`,
            assetId: input.assetId
        },
    });

    return llmResponse.text;
  }
);
