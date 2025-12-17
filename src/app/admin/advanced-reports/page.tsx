
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAdvancedReportData } from '@/app/actions/getAdvancedReportData';
import type { VehicleType } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, Filter, AlertTriangle, Loader2 } from 'lucide-react';

// Define types for chart data to match server action return type
interface OutcomeData { name: string; value: number; fill: string; }
interface ServiceTypeData { name: string; value: number; fill: string; }
interface FailureData { name: string; total: number; }
interface CostData { name: string; totalCost: number; }
interface TaskStatusData { name: string; value: number; fill: string; }
interface ViolationData { name: string; value: number; fill: string; }
interface ExpenseData { name: string; totalAmount: number; }

interface AdvancedReportState {
  inspectionOutcomes: OutcomeData[];
  maintenanceServicesByType: ServiceTypeData[];
  frequentFailures: FailureData[];
  maintenanceCosts: CostData[];
  taskStatusData: TaskStatusData[];
  violationsByTypeData: ViolationData[];
  expensesByCategoryData: ExpenseData[];
  hasData: boolean;
}

export default function AdvancedReportsPage() {
  const [reportData, setReportData] = useState<AdvancedReportState | null>(null);
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
        // Handle error state if needed
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
              <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Report Filters</CardTitle>
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
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={reportData.inspectionOutcomes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {reportData.inspectionOutcomes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>

               <Card>
                <CardHeader><CardTitle>Maintenance by Type</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={reportData.maintenanceServicesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {reportData.maintenanceServicesByType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Most Frequent Failures</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.frequentFailures} layout="vertical" margin={{ left: 20 }}>
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
                <CardHeader><CardTitle>Task Status</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={reportData.taskStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {reportData.taskStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>

               <Card>
                <CardHeader><CardTitle>Violations by Type</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                            <Pie data={reportData.violationsByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {reportData.violationsByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                   </ChartContainer>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Maintenance Costs by Asset</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.maintenanceCosts}>
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
                <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={CHART_CONFIG} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.expensesByCategoryData}>
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
