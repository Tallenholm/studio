'use server';

import { loadFleetAssets, loadInspectionReports, loadMaintenanceLogs } from '@/lib/localStorageService';
import type { FleetAsset, InspectionReport, MaintenanceLog } from '@/lib/types';
import { subMonths, isAfter, parseISO } from 'date-fns';

/**
 * Calculates a health score for a single asset based on recent failed inspections and repairs.
 * This also corrects a bug where the asset ID was being used to match VINs.
 */
const calculateHealthScore = (asset: FleetAsset, reports: InspectionReport[], logs: MaintenanceLog[]): number => {
    const last30Days = subMonths(new Date(), 1);
    
    // Filter reports by VIN
    const assetReports = reports.filter(r => 
        (r.truckVin === asset.vin || r.trailerVin === asset.vin || r.heavyEquipmentVin === asset.vin) && 
        isAfter(parseISO(r.date), last30Days)
    );
    const failedReports = assetReports.filter(r => r.overallStatus === 'fail').length;

    let score = 100;
    score -= failedReports * 25; // Each failure in the last month costs 25 points

    // Filter logs by the asset's unique ID
    const assetLogs = logs.filter(l => 
        l.assetId === asset.id && 
        isAfter(parseISO(l.date), last30Days)
    );
    const repairs = assetLogs.filter(l => l.serviceType === 'repair').length;
    score -= repairs * 15; // Each repair costs 15 points

    return Math.max(0, score);
};

/**
 * Calculates maintenance cost data for a single asset over the last 6 months.
 */
const getMaintenanceCostData = (assetId: string, logs: MaintenanceLog[]): { name: string; totalCost: number }[] => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const assetLogs = logs.filter(l => l.assetId === assetId && isAfter(parseISO(l.date), sixMonthsAgo));
    
    const costByMonth: Record<string, number> = {};

    assetLogs.forEach(log => {
      const month = parseISO(log.date).toLocaleString('default', { month: 'short' });
      costByMonth[month] = (costByMonth[month] || 0) + (log.cost || 0);
    });

    return Object.entries(costByMonth).map(([name, totalCost]) => ({ name, totalCost }));
};

export interface FleetHealthData {
    asset: FleetAsset;
    healthScore: number;
    maintenanceCostData: { name: string; totalCost: number }[];
}

/**
 * A Server Action that fetches all fleet health data, including calculated
 * health scores and recent maintenance costs. This offloads processing from the client.
 */
export async function getFleetHealthData(): Promise<FleetHealthData[]> {
    const assets = loadFleetAssets();
    const reports = loadInspectionReports();
    const logs = loadMaintenanceLogs();

    const healthData = assets.map(asset => {
        const score = calculateHealthScore(asset, reports, logs);
        const costData = getMaintenanceCostData(asset.id, logs);
        
        return {
            asset,
            healthScore: score,
            maintenanceCostData: costData
        };
    });

    return healthData;
}
