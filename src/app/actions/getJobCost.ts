

'use server';

import { getMaintenanceLogsByAssetIds, getExpenseReportsByEmployeeIds, getUsersByIds } from '@/lib/firestoreService';
import type { Job, User } from '@/lib/types';
import { isWithinInterval, parseISO, differenceInBusinessDays, addDays } from 'date-fns';

export async function getJobCost(job: Job | null) {
    if (!job) return { maintenanceCost: 0, expenseCost: 0, laborCost: 0, totalCost: 0, estimatedProfit: 0 };
    
    // Get all assigned user and asset IDs
    const assignedMainCrewIds = new Set(job.assignedEmployeeIds || []);
    const assignedSidewalkCrewIds = new Set(job.assignedSidewalkCrewIds || []);
    const allAssignedEmployeeIds = Array.from(new Set([...assignedMainCrewIds, ...assignedSidewalkCrewIds]));
    
    const assignedAssetIds = Array.from(new Set([
      ...(job.assignedTruckIds || []),
      ...(job.assignedTrailerIds || []),
      ...(job.assignedHeavyEquipmentIds || []),
    ]));

    // Fetch data using the new optimized functions
    const [allMaintenanceLogsForAssets, allExpenseReportsForEmployees, assignedEmployees] = await Promise.all([
        getMaintenanceLogsByAssetIds(assignedAssetIds),
        getExpenseReportsByEmployeeIds(allAssignedEmployeeIds),
        allAssignedEmployeeIds.length > 0 ? getUsersByIds(allAssignedEmployeeIds) : Promise.resolve([]),
    ]);
    
    const jobInterval = {
      start: parseISO(job.startDate),
      end: parseISO(job.endDate),
    };

    // Now filter the smaller, pre-filtered arrays by date
    const maintenanceCost = allMaintenanceLogsForAssets
      .filter(log => isWithinInterval(parseISO(log.date), jobInterval))
      .reduce((acc, log) => acc + (log.cost || 0), 0);
      
    const expenseCost = allExpenseReportsForEmployees
      .filter(report => isWithinInterval(parseISO(report.date), jobInterval))
      .reduce((acc, report) => acc + report.amount, 0);

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

