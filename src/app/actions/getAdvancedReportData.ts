
'use server';

import { 
    getInspectionReports, 
    getMaintenanceLogs, 
    getTasks, 
    getViolations, 
    getFleetAssets, 
    getExpenseReports,
    getInspectionReportsInDateRange,
    getMaintenanceLogsInDateRange,
    getTasksInDateRange,
    getViolationsInDateRange,
    getExpenseReportsInDateRange
} from '@/lib/firestoreService';
import type { InspectionReport, MaintenanceLog, Task, Violation, ExpenseReport, FleetAsset, VehicleType, ExpenseCategory } from '@/lib/types';
import { subDays, isWithinInterval, parseISO, format } from 'date-fns';

interface ChartDataPoint {
    name: string;
    value: number;
    fill: string;
}

interface AdvancedReportData {
  inspectionOutcomes: ChartDataPoint[];
  maintenanceServicesByType: ChartDataPoint[];
  frequentFailures: { name: string; total: number }[];
  maintenanceCosts: { name: string; totalCost: number }[];
  taskStatusData: ChartDataPoint[];
  violationsByTypeData: ChartDataPoint[];
  expensesByCategoryData: { name: string; totalAmount: number }[];
  hasData: boolean;
}

export async function getAdvancedReportData(
  dateRangeFilter: 'all_time' | 'last_30_days' | 'last_quarter', 
  vehicleTypeFilter: VehicleType | 'all'
): Promise<AdvancedReportData> {
  const now = new Date();
  const dateRange = 
    dateRangeFilter === 'last_30_days' ? { start: subDays(now, 30), end: now }
    : dateRangeFilter === 'last_quarter' ? { start: subDays(now, 90), end: now }
    : null;
    
  const startDateStr = dateRange ? format(dateRange.start, 'yyyy-MM-dd') : null;
  const endDateStr = dateRange ? format(dateRange.end, 'yyyy-MM-dd') : null;

  // Fetch data from Firestore, using filtered queries where possible
  const [reports, logs, tasks, violations, expenses, fleetAssets] = await Promise.all([
    dateRange && startDateStr && endDateStr ? getInspectionReportsInDateRange(startDateStr, endDateStr) : getInspectionReports(),
    dateRange && startDateStr && endDateStr ? getMaintenanceLogsInDateRange(startDateStr, endDateStr) : getMaintenanceLogs(),
    dateRange && startDateStr && endDateStr ? getTasksInDateRange(startDateStr, endDateStr) : getTasks(),
    dateRange && startDateStr && endDateStr ? getViolationsInDateRange(startDateStr, endDateStr) : getViolations(),
    dateRange && startDateStr && endDateStr ? getExpenseReportsInDateRange(startDateStr, endDateStr) : getExpenseReports(),
    getFleetAssets() // Always get all assets for filtering
  ]);
  
  const hasAnyData = reports.length > 0 || logs.length > 0 || tasks.length > 0 || violations.length > 0 || expenses.length > 0;
  if (!hasAnyData) {
    return {
      inspectionOutcomes: [],
      maintenanceServicesByType: [],
      frequentFailures: [],
      maintenanceCosts: [],
      taskStatusData: [],
      violationsByTypeData: [],
      expensesByCategoryData: [],
      hasData: false,
    };
  }

  // Vehicle Type Filtering Logic (remains in-memory)
  const filterByVehicleType = <T extends { assetId?: string; truckVin?: string; trailerVin?: string; heavyEquipmentVin?: string }>(items: T[]) => {
    if (vehicleTypeFilter === 'all') return items;
    const assetVinsOfType = new Set(fleetAssets.filter(a => a.type === vehicleTypeFilter).map(a => a.vin));
    const assetIdsOfType = new Set(fleetAssets.filter(a => a.type === vehicleTypeFilter).map(a => a.id));

    return items.filter(item => {
      if (item.assetId && assetIdsOfType.has(item.assetId)) {
        return true;
      }
      const itemVin = item.truckVin || item.trailerVin || item.heavyEquipmentVin;
      if (itemVin && assetVinsOfType.has(itemVin)) {
        return true;
      }
      return false;
    });
  };

  // Apply vehicle type filter to already date-filtered collections
  const filteredReports = filterByVehicleType(reports);
  const filteredLogs = filterByVehicleType(logs);
  const filteredTasks = tasks;
  const filteredViolations = violations;
  const filteredExpenses = expenses;

  // Perform aggregations
  const inspectionOutcomes = [
    { name: 'Pass', value: filteredReports.filter(r => r.overallStatus === 'pass').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Fail', value: filteredReports.filter(r => r.overallStatus === 'fail').length, fill: 'hsl(var(--chart-2))' },
  ];

  const serviceCounts: Record<string, number> = { routine: 0, repair: 0, inspection: 0, other: 0 };
  filteredLogs.forEach(log => {
      serviceCounts[log.serviceType] = (serviceCounts[log.serviceType] || 0) + 1;
  });
  const maintenanceServicesByType = [
      { name: 'Routine', value: serviceCounts.routine, fill: 'hsl(var(--chart-1))' },
      { name: 'Repair', value: serviceCounts.repair, fill: 'hsl(var(--chart-2))' },
      { name: 'Inspection', value: serviceCounts.inspection, fill: 'hsl(var(--chart-3))' },
      { name: 'Other', value: serviceCounts.other, fill: 'hsl(var(--chart-5))' },
  ];

  const failureCounts: { [key: string]: number } = {};
  filteredReports.forEach(report => {
    report.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.status === 'fail') {
          failureCounts[item.name] = (failureCounts[item.name] || 0) + 1;
        }
      });
    });
  });
  const frequentFailures = Object.entries(failureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  const costMap: { [key: string]: number } = {};
  filteredLogs.forEach(log => {
      const asset = fleetAssets.find(a => a.id === log.assetId);
      if (asset && log.cost) {
          costMap[asset.name] = (costMap[asset.name] || 0) + log.cost;
      }
  });
  const maintenanceCosts = Object.entries(costMap).map(([name, totalCost]) => ({
    name,
    totalCost,
  })).sort((a, b) => b.totalCost - a.totalCost);

  const taskStatusData = [
    { name: 'Pending', value: filteredTasks.filter(t => t.status === 'pending').length, fill: 'hsl(var(--chart-4))' },
    { name: 'Completed', value: filteredTasks.filter(t => t.status === 'completed').length, fill: 'hsl(var(--chart-1))' },
  ];

  const expenseMap: { [key in ExpenseCategory]?: number } = {};
  filteredExpenses.forEach(expense => {
    if (expense.category) {
        expenseMap[expense.category] = (expenseMap[expense.category] || 0) + expense.amount;
    }
  });
  const expensesByCategoryData = Object.entries(expenseMap)
    .map(([name, totalAmount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      totalAmount: totalAmount || 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
    
  const violationCounts: Record<string, number> = {};
  filteredViolations.forEach(v => {
      if(v.type) {
        violationCounts[v.type] = (violationCounts[v.type] || 0) + 1;
      }
  });
  const violationsByTypeData = [
    { name: 'Safety', value: violationCounts.safety || 0, fill: 'hsl(var(--chart-2))'},
    { name: 'Conduct', value: violationCounts.conduct || 0, fill: 'hsl(var(--chart-3))'},
    { name: 'Performance', value: violationCounts.performance || 0, fill: 'hsl(var(--chart-4))'},
    { name: 'Other', value: violationCounts.other || 0, fill: 'hsl(var(--chart-5))'},
  ];

  return {
    inspectionOutcomes,
    maintenanceServicesByType,
    frequentFailures,
    maintenanceCosts,
    taskStatusData,
    violationsByTypeData,
    expensesByCategoryData,
    hasData: true,
  };
}
