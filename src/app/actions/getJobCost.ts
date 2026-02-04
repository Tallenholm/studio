'use server';

import { getMaintenanceLogsInDateRange, getExpenseReportsInDateRange, getUsersByIds } from '@/lib/firestoreService';
import type { Job, User } from '@/lib/types';
import { isWithinInterval, parseISO, differenceInBusinessDays, addDays } from 'date-fns';

export async function getJobCost(job: Job | null) {
    if (!job) return { maintenanceCost: 0, expenseCost: 0, laborCost: 0, totalCost: 0, estimatedProfit: 0 };
    
    // Get all assigned user IDs from the job object first
    const assignedMainCrewIds = new Set(job.assignedEmployeeIds || []);
    const assignedSidewalkCrewIds = new Set(job.assignedSidewalkCrewIds || []);
    const allAssignedEmployeeIds = Array.from(new Set([...assignedMainCrewIds, ...assignedSidewalkCrewIds]));

    // Fetch only the necessary data using filtered queries
    const [maintenanceLogs, expenseReports, assignedEmployees] = await Promise.all([
        getMaintenanceLogsInDateRange(job.startDate, job.endDate),
        getExpenseReportsInDateRange(job.startDate, job.endDate),
        allAssignedEmployeeIds.length > 0 ? getUsersByIds(allAssignedEmployeeIds) : Promise.resolve([]),
    ]);

    const assignedAssetIds = new Set([
      ...(job.assignedTruckIds || []),
      ...(job.assignedTrailerIds || []),
      ...(job.assignedHeavyEquipmentIds || []),
    ]);

    // Now filter the already date-filtered logs by asset ID in memory
    const maintenanceCost = maintenanceLogs
      .filter(log => log.assetId && assignedAssetIds.has(log.assetId))
      .reduce((acc, log) => acc + (log.cost || 0), 0);
      
    // Expense reports are already correctly filtered by date
    const expenseCost = expenseReports.reduce((acc, report) => acc + report.amount, 0);

    const jobInterval = {
      start: parseISO(job.startDate),
      end: parseISO(job.endDate),
    };
    // Refined job duration calculation
    const jobDurationDays = differenceInBusinessDays(addDays(jobInterval.end, 1), jobInterval.start);
    // Ensure a minimum of 1 day (8 hours) for jobs that start and end on the same day or over a weekend.
    const jobDurationHours = Math.max(1, jobDurationDays) * 8; 

    // assignedEmployees is now the pre-filtered list
    const laborCost = assignedEmployees.reduce((acc, employee) => {
        if (employee.hourlyRate) {
            return acc + (employee.hourlyRate * jobDurationHours);
        }
        return acc;
    }, 0);
        
    const totalCost = maintenanceCost + expenseCost + laborCost;
    const estimatedProfit = (job.jobValue || 0) - totalCost;

    return {
      maintenanceCost,
      expenseCost,
      laborCost,
      totalCost,
      estimatedProfit
    };
}
