
'use server';

import { generateAssetHealthSummary as generateSummaryFlow } from '@/ai/flows/generate-asset-health-summary';
import { getFirestoreInstance, getInspectionReports, getMaintenanceLogs, getFleetAssetById } from '@/lib/firestoreService';

interface GenerateAssetHealthSummaryParams {
  assetId: string;
}

/**
 * A Server Action that fetches an asset's history and uses an AI flow to generate
 * a natural language health summary.
 */
export async function generateAssetHealthSummary(
  { assetId }: GenerateAssetHealthSummaryParams
): Promise<string> {
  const db = getFirestoreInstance();
  // 1. Load all necessary data from Firestore
  const [asset, allReports, allLogs] = await Promise.all([
    getFleetAssetById(db, assetId),
    getInspectionReports(db),
    getMaintenanceLogs(db)
  ]);
  
  if (!asset) {
    throw new Error(`Asset with ID ${assetId} not found.`);
  }

  // 2. Filter reports and logs specific to this asset
  const assetReports = allReports.filter(r => 
    r.truckVin === asset.vin || 
    r.trailerVin === asset.vin || 
    r.heavyEquipmentVin === asset.vin
  );
  
  const assetLogs = allLogs.filter(l => l.assetId === assetId);
  
  // 3. Sort and stringify the history for the AI prompt
  const inspectionHistory = JSON.stringify(
    assetReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10) // Limit to last 10
  );
  const maintenanceHistory = JSON.stringify(
    assetLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10) // Limit to last 10
  );

  // 4. Call the centralized AI flow with the prepared data
  const summary = await generateSummaryFlow({ inspectionHistory, maintenanceHistory });
  
  return summary;
}
