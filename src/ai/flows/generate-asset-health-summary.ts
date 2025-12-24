
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {getInspectionReports, getMaintenanceLogs, getFleetAssetById} from '@/lib/firestoreService';
import type {InspectionReport, MaintenanceLog, FleetAsset} from '@/lib/types';
import {subMonths, isAfter, parseISO} from 'date-fns';

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
    
    // Fetch all and then filter, as there's no direct query for VIN across all report types
    const allReports = await getInspectionReports();
    const assetReports = allReports.filter(r => 
        r.truckVin === asset.vin || 
        r.trailerVin === asset.vin || 
        r.heavyEquipmentVin === asset.vin
    );
    
    // Fetch all logs and filter by assetId
    const allLogs = await getMaintenanceLogs();
    const assetLogs = allLogs.filter(l => l.assetId === assetId);

    // Filter for last 6 months to keep context smaller
    const sixMonthsAgo = subMonths(new Date(), 6);
    const recentReports = assetReports.filter(r => isAfter(parseISO(r.date), sixMonthsAgo));
    const recentLogs = assetLogs.filter(l => isAfter(parseISO(l.date), sixMonthsAgo));

    return { asset, reports: recentReports, logs: recentLogs };
  }
);


const generateHealthSummaryFlow = ai.defineFlow(
  {
    name: 'generateAssetHealthSummaryFlow',
    inputSchema: z.object({ assetId: z.string() }),
    outputSchema: z.string(),
    tools: [fetchAssetDataTool],
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
      model: 'gemini-pro',
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
