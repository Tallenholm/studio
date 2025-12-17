
'use server';

import { getMaintenanceLogs, getExpenseReports, getUsers } from '@/lib/firestoreService';
import type { Job, User } from '@/lib/types';
import { isWithinInterval, parseISO, differenceInBusinessDays, addDays } from 'date-fns';

export async function getJobCost(job: Job | null) {
    if (!job) return { maintenanceCost: 0, expenseCost: 0, laborCost: 0, totalCost: 0, estimatedProfit: 0 };
    
    const [maintenanceLogs, expenseReports, allUsers] = await Promise.all([
        getMaintenanceLogs(),
        getExpenseReports(),
        getUsers(),
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

    const jobDurationDays = differenceInBusinessDays(addDays(jobInterval.end, 1), jobInterval.start);
    const jobDurationHours = Math.max(1, jobDurationDays) * 8; // Assume 8-hour work days

    const assignedEmployees = allUsers.filter(u => job.assignedEmployeeIds?.includes(u.id));

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
