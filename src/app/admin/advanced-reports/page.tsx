'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadInspectionReports, loadMaintenanceLogs, loadTasks, loadViolations, loadExpenseReports, loadFleetAssets } from '@/lib/localStorageService';
import type { InspectionReport, MaintenanceLog, Task, Violation, ExpenseReport, ExpenseCategory, FleetAsset, VehicleType } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { subDays, isWithinInterval, parseISO } from 'date-fns';

// Define types for chart data
interface OutcomeData {
  name: string;
  value: number;
  fill: string;
}

interface FailureData {
  name: string;
  total: number;
}

interface CostData {
  name: string;
  totalCost: number;
}

interface TaskStatusData {
    name: string;
    value: number;
    fill: string;
}

interface ViolationData {
    name: string;
    value: number;
    fill: string;
}

interface ExpenseData {
    name: string;
    totalAmount: number;
}

export default function AdvancedReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);

  const [dateRangeFilter, setDateRangeFilter] = useState('all_time');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | 'all'>('all');

  useEffect(() => {
    setIsMounted(true);
    setReports(loadInspectionReports());
    setLogs(loadMaintenanceLogs());
    setTasks(loadTasks());
    setViolations(loadViolations());
    setExpenses(loadExpenseReports());
    setFleetAssets(loadFleetAssets());
  }, []);

  const dateFilterRange = useMemo(() => {
    const now = new Date();
    if (dateRangeFilter === 'last_30_days') return { start: subDays(now, 30), end: now };
    if (dateRangeFilter === 'last_quarter') return { start: subDays(now, 90), end: now };
    return null; // all_time
  }, [dateRangeFilter]);

  const filteredData = useMemo(() => {
    const filterByDate = (items: { date: string }[]) => {
      if (!dateFilterRange) return items;
      return items.filter(item => isWithinInterval(parseISO(item.date), dateFilterRange));
    };

    const filterByVehicleType = <T extends { assetId?: string, truckVin?: string, trailerVin?: string, heavyEquipmentVin?: string }>(items: T[]) => {
      if (vehicleTypeFilter === 'all') return items;
      const assetVinsOfType = fleetAssets.filter(a => a.type === vehicleTypeFilter).map(a => a.vin);
      return items.filter(item => {
        const itemAssetId = item.assetId;
        const itemVin = item.truckVin || item.trailerVin || item.heavyEquipmentVin;
        if(itemAssetId) { // For maintenance logs
          const asset = fleetAssets.find(a => a.id === itemAssetId);
          return asset?.type === vehicleTypeFilter;
        }
        if(itemVin) { // for inspection reports
          return assetVinsOfType.includes(itemVin);
        }
        return false;
      });
    };

    const filteredReports = filterByVehicleType(filterByDate(reports) as InspectionReport[]);
    const filteredLogs = filterByVehicleType(filterByDate(logs) as MaintenanceLog[]);
    
    // Tasks, violations, and expenses are not typically asset-specific in this app's model, so only filter by date
    const filteredTasks = filterByDate(tasks) as Task[];
    const filteredViolations = filterByDate(violations) as Violation[];
    const filteredExpenses = filterByDate(expenses) as ExpenseReport[];

    return { filteredReports, filteredLogs, filteredTasks, filteredViolations, filteredExpenses };
  }, [reports, logs, tasks, violations, expenses, fleetAssets, dateRangeFilter, vehicleTypeFilter, dateFilterRange]);


  const inspectionOutcomes: OutcomeData[] = [
    { name: 'Pass', value: filteredData.filteredReports.filter(r => r.overallStatus === 'pass').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Fail', value: filteredData.filteredReports.filter(r => r.overallStatus === 'fail').length, fill: 'hsl(var(--chart-2))' },
  ];

  const frequentFailures: FailureData[] = (() => {
    const failureCounts: { [key: string]: number } = {};
    filteredData.filteredReports.forEach(report => {
      report.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.status === 'fail') {
            failureCounts[item.name] = (failureCounts[item.name] || 0) + 1;
          }
        });
      });
    });
    return Object.entries(failureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  })();

  const maintenanceCosts: CostData[] = (() => {
    const costMap: { [key: string]: number } = {};
    filteredData.filteredLogs.forEach(log => {
      if (log.cost) {
        costMap[log.assetName] = (costMap[log.assetName] || 0) + log.cost;
      }
    });
    return Object.entries(costMap).map(([name, totalCost]) => ({
      name,
      totalCost,
    })).sort((a, b) => b.totalCost - a.totalCost);
  })();

  const taskStatusData: TaskStatusData[] = [
    { name: 'Pending', value: filteredData.filteredTasks.filter(t => t.status === 'pending').length, fill: 'hsl(var(--chart-4))' },
    { name: 'Completed', value: filteredData.filteredTasks.filter(t => t.status === 'completed').length, fill: 'hsl(var(--chart-1))' },
  ];

  const expensesByCategoryData: ExpenseData[] = (() => {
    const expenseMap: { [key in ExpenseCategory]?: number } = {};
    filteredData.filteredExpenses.forEach(expense => {
      expenseMap[expense.category] = (expenseMap[expense.category] || 0) + expense.amount;
    });
    return Object.entries(expenseMap)
      .map(([name, totalAmount]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        totalAmount: totalAmount || 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  })();

  const violationsByTypeData: ViolationData[] = (() => {
      const counts: Record<string, number> = {};
      filteredData.filteredViolations.forEach(v => {
          counts[v.type] = (counts[v.type] || 0) + 1;
      });
      return [
        { name: 'Safety', value: counts.safety || 0, fill: 'hsl(var(--chart-2))'},
        { name: 'Conduct', value: counts.conduct || 0, fill: 'hsl(var(--chart-3))'},
        { name: 'Performance', value: counts.performance || 0, fill: 'hsl(var(--chart-4))'},
        { name: 'Other', value: counts.other || 0, fill: 'hsl(var(--chart-5))'},
      ];
  })();

  const CHART_CONFIG = {
    total: {
      label: 'Failures',
      color: 'hsl(var(--chart-1))',
    },
    totalCost: {
      label: 'Cost',
      color: 'hsl(var(--chart-2))',
    },
    totalAmount: {
      label: 'Amount',
      color: 'hsl(var(--chart-3))',
    },
  };
  
  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Advanced Reports...</p>
      </div>
    );
  }
  
  const noData = reports.length === 0 && logs.length === 0 && tasks.length === 0 && violations.length === 0 && expenses.length === 0;

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <LineChartIcon className="h-8 w-8 text-primary" />
            Advanced Fleet Analytics
          </CardTitle>
          <CardDescription>
            Dive deep into your fleet's data with customizable reports and visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                 <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_time">All Time</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_quarter">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle-type">Vehicle/Equipment Type</Label>
                <Select value={vehicleTypeFilter} onValueChange={(value) => setVehicleTypeFilter(value as VehicleType | 'all')}>
                  <SelectTrigger id="vehicle-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="heavyEquipment">Heavy Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {noData ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <div className="flex justify-center items-center gap-4 mb-4 text-muted-foreground">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <p className="text-lg text-muted-foreground">
                  No data available to generate reports.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete some inspections or add maintenance logs to see analytics.
                </p>
              </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={inspectionOutcomes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {inspectionOutcomes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Frequent Failures</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={frequentFailures} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <CardTitle>Task Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {taskStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <CardTitle>Violations by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={violationsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {violationsByTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Maintenance Costs by Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={maintenanceCosts}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="totalCost" fill="hsl(var(--chart-2))" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expensesByCategoryData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="totalAmount" fill="hsl(var(--chart-3))" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}