
'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadInspectionReports, loadMaintenanceLogs } from '@/lib/localStorageService';
import type { InspectionReport, MaintenanceLog } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, Filter, AlertTriangle, Loader2 } from 'lucide-react';

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

export default function AdvancedReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setReports(loadInspectionReports());
    setLogs(loadMaintenanceLogs());
  }, []);

  const inspectionOutcomes: OutcomeData[] = [
    { name: 'Pass', value: reports.filter(r => r.overallStatus === 'pass').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Fail', value: reports.filter(r => r.overallStatus === 'fail').length, fill: 'hsl(var(--chart-2))' },
  ];

  const frequentFailures: FailureData[] = (() => {
    const failureCounts: { [key: string]: number } = {};
    reports.forEach(report => {
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
    logs.forEach(log => {
      if (log.cost) {
        costMap[log.assetName] = (costMap[log.assetName] || 0) + log.cost;
      }
    });
    return Object.entries(costMap).map(([name, totalCost]) => ({
      name,
      totalCost,
    })).sort((a, b) => b.totalCost - a.totalCost);
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
  };
  
  if (!isMounted) {
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
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="report-type">Data Set</Label>
                <Select>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="All Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_data">All Data</SelectItem>
                    <SelectItem value="inspections">Inspections</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                 <Select>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_time">All Time</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle-type">Vehicle/Equipment Type</Label>
                <Select>
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
            <CardContent>
                <Button className="w-full md:w-auto">Generate Report</Button>
            </CardContent>
          </Card>
          
          {reports.length === 0 && logs.length === 0 ? (
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
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
