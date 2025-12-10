
'use server';

import { getFirestoreInstance, getFleetAssets, getInspectionReports, getMaintenanceLogs } from '@/lib/firestoreService';
import type { FleetAsset, InspectionReport, MaintenanceLog } from '@/lib/types';
import { subMonths, isAfter, parseISO } from 'date-fns';

/**
 * Calculates a health score for a single asset based on recent failed inspections and repairs.
 */
const calculateHealthScore = (asset: FleetAsset, reports: InspectionReport[], logs: MaintenanceLog[]): number => {
    const last30Days = subMonths(new Date(), 1);
    
    // Reports are pre-filtered by VIN
    const assetReports = reports.filter(r => isAfter(parseISO(r.date), last30Days));
    const failedReports = assetReports.filter(r => r.overallStatus === 'fail').length;

    let score = 100;
    score -= failedReports * 25; // Each failure in the last month costs 25 points

    // Logs are pre-filtered by asset ID
    const assetLogs = logs.filter(l => isAfter(parseISO(l.date), last30Days));
    const repairs = assetLogs.filter(l => l.serviceType === 'repair').length;
    score -= repairs * 15; // Each repair costs 15 points

    return Math.max(0, score);
};

/**
 * Calculates maintenance cost data for a single asset over the last 6 months.
 */
const getMaintenanceCostData = (logs: MaintenanceLog[]): { name: string; totalCost: number }[] => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const assetLogs = logs.filter(l => isAfter(parseISO(l.date), sixMonthsAgo));
    
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
 * A Server Action that fetches all fleet health data from Firestore, including calculated
 * health scores and recent maintenance costs. This offloads processing from the client.
 */
export async function getFleetHealthData(): Promise<FleetHealthData[]> {
    const db = getFirestoreInstance();
    const [assets, allReports, allLogs] = await Promise.all([
        getFleetAssets(db),
        getInspectionReports(db),
        getMaintenanceLogs(db),
    ]);

    // Pre-group reports and logs by asset for efficiency
    const reportsByVin: Record<string, InspectionReport[]> = {};
    for (const report of allReports) {
        const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
        if (vin) {
            if (!reportsByVin[vin]) {
                reportsByVin[vin] = [];
            }
            reportsByVin[vin].push(report);
        }
    }

    const logsByAssetId: Record<string, MaintenanceLog[]> = {};
    for (const log of allLogs) {
        if (!logsByAssetId[log.assetId]) {
            logsByAssetId[log.assetId] = [];
        }
        logsByAssetId[log.assetId].push(log);
    }

    const healthData = assets.map(asset => {
        const assetReports = reportsByVin[asset.vin] || [];
        const assetLogs = logsByAssetId[asset.id] || [];

        const score = calculateHealthScore(asset, assetReports, assetLogs);
        const costData = getMaintenanceCostData(assetLogs);
        
        return {
            asset,
            healthScore: score,
            maintenanceCostData: costData
        };
    });

    return healthData;
}
