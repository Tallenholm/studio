
'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadFleetAssets, loadInspectionReports, loadMaintenanceLogs } from '@/lib/localStorageService';
import type { FleetAsset, InspectionReport, MaintenanceLog } from '@/lib/types';
import { generateAssetHealthSummary } from '@/ai/flows/generate-asset-health-summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, HeartPulse, Loader2, Truck, Box, Shovel, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { subMonths, isAfter, parseISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface HealthSummary {
  assetId: string;
  summary: string;
  isLoading: boolean;
}

const CHART_CONFIG = {
  totalCost: {
    label: 'Cost',
    color: 'hsl(var(--chart-1))',
  },
};

export default function FleetHealthPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [summaries, setSummaries] = useState<Record<string, HealthSummary>>({});
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    setAssets(loadFleetAssets());
    setReports(loadInspectionReports());
    setLogs(loadMaintenanceLogs());
  }, []);

  const calculateHealthScore = (assetId: string) => {
    const last30Days = subMonths(new Date(), 1);
    const assetReports = reports.filter(r => (r.truckVin === assetId || r.trailerVin === assetId || r.heavyEquipmentVin === assetId) && isAfter(parseISO(r.date), last30Days));
    const failedReports = assetReports.filter(r => r.overallStatus === 'fail').length;

    let score = 100;
    score -= failedReports * 25; // Each failure in the last month costs 25 points

    const assetLogs = logs.filter(l => l.assetId === assetId && isAfter(parseISO(l.date), last30Days));
    const repairs = assetLogs.filter(l => l.serviceType === 'repair').length;
    score -= repairs * 15; // Each repair costs 15 points

    return Math.max(0, score);
  };

  const getMaintenanceCostData = (assetId: string) => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const assetLogs = logs.filter(l => l.assetId === assetId && isAfter(parseISO(l.date), sixMonthsAgo));
    
    const costByMonth: Record<string, number> = {};

    assetLogs.forEach(log => {
      const month = parseISO(log.date).toLocaleString('default', { month: 'short' });
      costByMonth[month] = (costByMonth[month] || 0) + (log.cost || 0);
    });

    return Object.entries(costByMonth).map(([name, totalCost]) => ({ name, totalCost }));
  };

  const handleGenerateSummary = async (assetId: string, assetName: string) => {
    setSummaries(prev => ({ ...prev, [assetId]: { assetId, summary: '', isLoading: true } }));
    try {
      const summary = await generateAssetHealthSummary({ assetId });
      setSummaries(prev => ({ ...prev, [assetId]: { assetId, summary, isLoading: false } }));
      toast({ title: 'Analysis Complete', description: `Generated health summary for ${assetName}.` });
    } catch (error) {
      console.error('AI Health Summary Error:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: `Could not generate summary for ${assetName}.` });
      setSummaries(prev => ({ ...prev, [assetId]: { assetId, summary: 'Failed to generate summary.', isLoading: false } }));
    }
  };

  const getAssetIcon = (type: FleetAsset['type']) => {
    switch (type) {
      case 'truck': return <Truck className="h-6 w-6 text-primary" />;
      case 'trailer': return <Box className="h-6 w-6 text-primary" />;
      case 'heavyEquipment': return <Shovel className="h-6 w-6 text-primary" />;
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading Fleet Health...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-primary" />
            Fleet Health & Intelligence
          </CardTitle>
          <CardDescription>
            At-a-glance health scores and AI-powered analysis for every asset in your fleet.
          </CardDescription>
        </CardHeader>
      </Card>

      {assets.length === 0 ? (
        <Card className="text-center py-12">
            <CardHeader>
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl font-headline">No Fleet Assets Found</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-lg">
                Add some vehicles and equipment on the 'Manage Fleet' page to see their health status here.
                </CardDescription>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {assets.map(asset => {
            const healthScore = calculateHealthScore(asset.id);
            const healthColor = healthScore > 80 ? 'text-green-500' : healthScore > 50 ? 'text-yellow-500' : 'text-red-500';
            const costData = getMaintenanceCostData(asset.id);

            return (
              <Card key={asset.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      {getAssetIcon(asset.type)} {asset.name}
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Health Score</p>
                      <p className={`text-3xl font-bold ${healthColor}`}>{healthScore}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">AI Health Summary</h4>
                    <div className="p-3 bg-muted/50 rounded-md border min-h-[100px] text-sm text-muted-foreground">
                      {summaries[asset.id]?.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing history...
                        </div>
                      ) : (
                        summaries[asset.id]?.summary || 'Click below to generate an AI summary.'
                      )}
                    </div>
                  </div>
                   {costData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Maintenance Costs (Last 6 Months)</h4>
                      <ChartContainer config={CHART_CONFIG} className="h-[100px] w-full">
                        <BarChart data={costData} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} width={40} fontSize={10} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                          <Bar dataKey="totalCost" fill="hsl(var(--chart-1))" radius={4} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleGenerateSummary(asset.id, asset.name)}
                    disabled={summaries[asset.id]?.isLoading}
                    className="w-full"
                  >
                    {summaries[asset.id]?.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="mr-2 h-4 w-4" />
                    )}
                    Generate AI Summary
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
