'use client';

import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface CommonChartProps {
    data: any[];
    config?: any;
}

export function InspectionOutcomesChart({ data }: CommonChartProps) {
    return (
        <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function MaintenanceByTypeChart({ data }: CommonChartProps) {
    return (
        <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function FrequentFailuresChart({ data, config }: CommonChartProps) {
    return (
        <ChartContainer config={config} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function TaskStatusChart({ data }: CommonChartProps) {
    return (
        <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function ViolationsByTypeChart({ data }: CommonChartProps) {
    return (
        <ChartContainer config={{}} className="aspect-square h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function MaintenanceCostsByAssetChart({ data, config }: CommonChartProps) {
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="totalCost" fill="hsl(var(--chart-2))" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}

export function ExpensesByCategoryChart({ data, config }: CommonChartProps) {
    return (
        <ChartContainer config={config} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="totalAmount" fill="hsl(var(--chart-3))" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
