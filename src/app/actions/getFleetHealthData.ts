
'use server';

import { getFleetAssets, getInspectionReportsInDateRange, getMaintenanceLogsInDateRange } from '@/lib/firestoreService';
import type { FleetAsset, InspectionReport, MaintenanceLog } from '@/lib/types';
import { subMonths, isAfter, parseISO, format } from 'date-fns';

/**
 * Calculates a health score for a single asset based on recent failed inspections and repairs.
 * The reports and logs passed in should already be filtered to the last 6 months.
 */
const calculateHealthScore = (asset: FleetAsset, reports: InspectionReport[], logs: MaintenanceLog[]): number => {
    const last30Days = subMonths(new Date(), 1);
    
    // Further filter the 6-month data to just the last 30 days for scoring
    const recentAssetReports = reports.filter(r => isAfter(parseISO(r.date), last30Days));
    const failedReports = recentAssetReports.filter(r => r.overallStatus === 'fail').length;

    let score = 100;
    score -= failedReports * 25; // Each failure in the last month costs 25 points

    const recentAssetLogs = logs.filter(l => isAfter(parseISO(l.date), last30Days));
    const repairs = recentAssetLogs.filter(l => l.serviceType === 'repair').length;
    score -= repairs * 15; // Each repair costs 15 points

    return Math.max(0, score);
};

/**
 * Calculates maintenance cost data for a single asset over the last 6 months.
 * The logs passed in are assumed to be already filtered for this period.
 */
const getMaintenanceCostData = (logs: MaintenanceLog[]): { name: string; totalCost: number }[] => {
    const costByMonth: Record<string, number> = {};

    // Initialize months for the chart
    for (let i = 5; i >= 0; i--) {
        const month = format(subMonths(new Date(), i), 'MMM');
        costByMonth[month] = 0;
    }

    // Aggregate costs from the pre-filtered logs
    logs.forEach(log => {
      const month = format(parseISO(log.date), 'MMM');
      if (costByMonth.hasOwnProperty(month)) { // Ensure we only add to initialized months
          costByMonth[month] += (log.cost || 0);
      }
    });

    return Object.entries(costByMonth).map(([name, totalCost]) => ({ name, totalCost }));
};

export interface FleetHealthData {
    asset: FleetAsset;
    healthScore: number;
    maintenanceCostData: { name: string; totalCost: number }[];
}

/**
 * A Server Action that fetches recent fleet health data from Firestore, including calculated
 * health scores and maintenance costs. This version is optimized to only fetch data from the last 6 months.
 */
export async function getFleetHealthData(): Promise<FleetHealthData[]> {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const today = new Date();

    // 1. Fetch only the data from the last 6 months.
    const [assets, recentReports, recentLogs] = await Promise.all([
        getFleetAssets(),
        getInspectionReportsInDateRange(format(sixMonthsAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
        getMaintenanceLogsInDateRange(format(sixMonthsAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
    ]);

    // 2. Pre-group recent reports and logs by asset for efficiency
    const reportsByVin: Record<string, InspectionReport[]> = {};
    for (const report of recentReports) {
        const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
        if (vin) {
            if (!reportsByVin[vin]) reportsByVin[vin] = [];
            reportsByVin[vin].push(report);
        }
    }

    const logsByAssetId: Record<string, MaintenanceLog[]> = {};
    for (const log of recentLogs) {
        if (log.assetId) {
            if (!logsByAssetId[log.assetId]) logsByAssetId[log.assetId] = [];
            logsByAssetId[log.assetId].push(log);
        }
    }

    // 3. Map over assets and perform calculations on the smaller, pre-filtered datasets.
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
