
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, CalendarDays, Filter, BarChart2, PieChart } from 'lucide-react';

export default function AdvancedReportsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <LineChart className="h-8 w-8 text-primary" />
            Advanced Fleet Analytics
          </CardTitle>
          <CardDescription>
            Generate detailed reports and visualize trends for your fleet's inspection and maintenance data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select disabled>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspection_summary">Inspection Summary</SelectItem>
                    <SelectItem value="anomaly_trends">Anomaly Trends</SelectItem>
                    <SelectItem value="maintenance_overview">Maintenance Overview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                 <Select disabled>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                     <SelectItem value="custom_range">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle-type">Vehicle/Equipment Type</Label>
                <Select disabled>
                  <SelectTrigger id="vehicle-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="skid_steer">Skid Steer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardContent>
                <Button disabled className="w-full md:w-auto">Generate Report</Button>
            </CardContent>
          </Card>

          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <div className="flex justify-center items-center gap-4 mb-4 text-muted-foreground">
                <BarChart2 className="h-10 w-10" />
                <PieChart className="h-10 w-10" />
                <LineChart className="h-10 w-10" />
            </div>
            <p className="text-lg text-muted-foreground">
              Generated reports and visualizations will appear here.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature is under active development to provide insightful fleet analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
