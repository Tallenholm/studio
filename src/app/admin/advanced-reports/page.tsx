'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, LineChartIcon, Filter, AlertTriangle } from "lucide-react";
import { getAdvancedReportData, type AdvancedReportData } from '@/app/actions/getAdvancedReportData';
import type { VehicleType } from '@/lib/types';

const InspectionOutcomesChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.InspectionOutcomesChart), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> });
const MaintenanceByTypeChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.MaintenanceByTypeChart), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> });
const FrequentFailuresChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.FrequentFailuresChart), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> });
const TaskStatusChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.TaskStatusChart), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> });
const ViolationsByTypeChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.ViolationsByTypeChart), { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-muted rounded-md" /> });
const MaintenanceCostsByAssetChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.MaintenanceCostsByAssetChart), { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" /> });
const ExpensesByCategoryChart = dynamic(() => import('@/components/analytics/AdvancedReportCharts').then(mod => mod.ExpensesByCategoryChart), { ssr: false, loading: () => <div className="h-[300px] w-full animate-pulse bg-muted rounded-md" /> });

// ... (keep interface definitions if they are used elsewhere, but they seem local to this file? No, they define the state)

export default function AdvancedReportsPage() {
  const [reportData, setReportData] = useState<AdvancedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [dateRangeFilter, setDateRangeFilter] = useState<'all_time' | 'last_30_days' | 'last_quarter'>('all_time');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<VehicleType | 'all'>('all');

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdvancedReportData(dateRangeFilter, vehicleTypeFilter);
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch advanced report data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRangeFilter, vehicleTypeFilter]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const CHART_CONFIG = {
    total: { label: 'Failures', color: 'hsl(var(--chart-1))' },
    totalCost: { label: 'Cost', color: 'hsl(var(--chart-2))' },
    totalAmount: { label: 'Amount', color: 'hsl(var(--chart-3))' },
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Advanced Reports...</p>
      </div>
    );
  }

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
              <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5" />Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRangeFilter} onValueChange={(val) => setDateRangeFilter(val as 'all_time' | 'last_30_days' | 'last_quarter')}>
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

          {!reportData?.hasData ? (
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
                <CardHeader><CardTitle>Inspection Outcomes</CardTitle></CardHeader>
                <CardContent>
                  <InspectionOutcomesChart data={reportData.inspectionOutcomes} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Maintenance by Type</CardTitle></CardHeader>
                <CardContent>
                  <MaintenanceByTypeChart data={reportData.maintenanceServicesByType} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Most Frequent Failures</CardTitle></CardHeader>
                <CardContent>
                  <FrequentFailuresChart data={reportData.frequentFailures} config={CHART_CONFIG} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Task Status</CardTitle></CardHeader>
                <CardContent>
                  <TaskStatusChart data={reportData.taskStatusData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Violations by Type</CardTitle></CardHeader>
                <CardContent>
                  <ViolationsByTypeChart data={reportData.violationsByTypeData} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Maintenance Costs by Asset</CardTitle></CardHeader>
                <CardContent>
                  <MaintenanceCostsByAssetChart data={reportData.maintenanceCosts} config={CHART_CONFIG} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <ExpensesByCategoryChart data={reportData.expensesByCategoryData} config={CHART_CONFIG} />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
