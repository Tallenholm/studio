
'use server';

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';
import { getReportsByVin, getMaintenanceLogsByAssetIds, getFleetAssetById } from '@/lib/firestoreService';
import type { InspectionReport, MaintenanceLog, FleetAsset } from '@/lib/types';
import { subMonths, isAfter, parseISO } from 'date-fns';

const fetchAssetDataTool = ai.defineTool(
  {
    name: 'fetchAssetData',
    description: 'Fetches maintenance logs and inspection reports for a specific fleet asset.',
    inputSchema: z.object({ assetId: z.string() }),
    outputSchema: z.object({
      asset: z.custom<FleetAsset>(),
      reports: z.array(z.custom<InspectionReport>()),
      logs: z.array(z.custom<MaintenanceLog>()),
    }),
  },
  async ({ assetId }) => {
    const asset = await getFleetAssetById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Fetch only the data relevant to this asset.
    const [assetReports, assetLogs] = await Promise.all([
      getReportsByVin(asset.vin), // Fetches reports for this VIN from the last 6 months.
      getMaintenanceLogsByAssetIds([assetId]), // Fetches all logs for this asset ID.
    ]);

    // The getReportsByVin function now handles the 6-month filtering.
    // We still need to filter maintenance logs for the last 6 months.
    const sixMonthsAgo = subMonths(new Date(), 6);
    const recentLogs = assetLogs.filter(l => isAfter(parseISO(l.date), sixMonthsAgo));

    return { asset, reports: assetReports, logs: recentLogs };
  }
);


const generateHealthSummaryFlow = ai.defineFlow(
  {
    name: 'generateAssetHealthSummaryFlow',
    inputSchema: z.object({ assetId: z.string() }),
    outputSchema: z.string(),
  },
  async ({ assetId }) => {
    const prompt = `You are a fleet maintenance expert. Your task is to provide a concise, natural language summary of a vehicle's health based on its recent inspection reports and maintenance logs.

    Analyze the provided data for the asset. Look for trends, such as recurring failures, recent repairs, and the overall status of inspections.
    
    - If there are recent failures, highlight them.
    - If there are many recent repairs, mention that it has been in for service frequently.
    - If the reports are all clean and there's no maintenance, state that the vehicle is in excellent condition.
    
    Provide a summary of 2-3 sentences. Be professional and clear.`;

    const llmResponse = await ai.generate({
      prompt,
      model: DEFAULT_MODEL,
      tools: [fetchAssetDataTool],
      toolChoice: 'auto',
      input: { assetId },
    });

    return llmResponse.text();
  }
);

export async function generateAssetHealthSummary(input: { assetId: string }): Promise<string> {
  return generateHealthSummaryFlow(input);
}
