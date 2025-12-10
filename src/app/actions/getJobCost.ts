
'use server';

import { getMaintenanceLogs, getExpenseReports } from '@/lib/firestoreService';
import type { Job } from '@/lib/types';
import { isWithinInterval, parseISO } from 'date-fns';

export async function getJobCost(job: Job | null) {
    if (!job) return { maintenanceCost: 0, expenseCost: 0, totalCost: 0, estimatedProfit: 0 };
    
    const [maintenanceLogs, expenseReports] = await Promise.all([
        getMaintenanceLogs(),
        getExpenseReports(),
    ]);

    const jobInterval = {
      start: parseISO(job.startDate),
      end: parseISO(job.endDate),
    };

    const assignedAssetIds = new Set([
      ...(job.assignedTruckIds || []),
      ...(job.assignedTrailerIds || []),
      ...(job.assignedHeavyEquipmentIds || []),
    ]);

    const maintenanceCost = maintenanceLogs
      .filter(log => 
        assignedAssetIds.has(log.assetId) && isWithinInterval(parseISO(log.date), jobInterval)
      )
      .reduce((acc, log) => acc + (log.cost || 0), 0);
      
    const expenseCost = expenseReports
        .filter(report => isWithinInterval(parseISO(report.date), jobInterval))
        .reduce((acc, report) => acc + report.amount, 0);
        
    const totalCost = maintenanceCost + expenseCost;
    const estimatedProfit = (job.jobValue || 0) - totalCost;

    return {
      maintenanceCost,
      expenseCost,
      totalCost,
      estimatedProfit
    };
}
