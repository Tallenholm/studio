'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface MaintenanceCostChartProps {
    data: any[];
    config: any;
}

export default function MaintenanceCostChart({ data, config }: MaintenanceCostChartProps) {
    return (
        <ChartContainer config={config} className="h-[100px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={5} fontSize={10} width={40} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                <Bar dataKey="totalCost" fill="hsl(var(--chart-1))" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
