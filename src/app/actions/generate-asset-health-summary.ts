
'use server';

// import { generateAssetHealthSummary as generateSummaryFlow } from '@/ai/flows/generate-asset-health-summary';
import { getInspectionReports, getMaintenanceLogs, getFleetAssetById } from '@/lib/firestoreService';

interface GenerateAssetHealthSummaryParams {
  assetId: string;
}

/**
 * A Server Action that invokes an AI flow to generate a natural language health summary for a given asset.
 * The flow itself is responsible for fetching the required data.
 */
export async function generateAssetHealthSummary(
  { assetId }: GenerateAssetHealthSummaryParams
): Promise<string> {
  // The AI flow now fetches its own data using a tool. 
  // This server action is just a pass-through to invoke the flow.
  // const summary = await generateSummaryFlow({ assetId });
  // return summary;
  return "AI summary is temporarily unavailable.";
}
