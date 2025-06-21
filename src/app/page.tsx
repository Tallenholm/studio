
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, FileText, AlertTriangle, CheckCircle2, History, Wrench, UserCheck, Truck } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold mb-8 text-center">Management Dashboard</h1>
      <p className="text-center text-lg text-muted-foreground mb-12">
        An overview of fleet operations, inspections, and management tools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <UserCheck className="text-primary" />
              Employee Portal
            </CardTitle>
            <CardDescription>
              Access the simplified view for drivers to complete their inspections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/employee" passHref>
              <Button className="w-full">Go to Employee Portal</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Truck className="text-primary" />
              Manage Fleet
            </CardTitle>
            <CardDescription>
              Add, view, and remove your fleet of vehicles and equipment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage-fleet" passHref>
              <Button className="w-full">Go to Fleet Management</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FileText className="text-primary" />
              View Reports
            </CardTitle>
            <CardDescription>
              Access and review all past inspection reports and their AI analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports" passHref>
              <Button className="w-full">Go to Reports</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><History className="text-primary"/>Recent Activity (Illustrative)</CardTitle>
          <CardDescription>This is an illustrative example of recent activities. A live feed would appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 border bg-card hover:bg-muted/50 transition-colors duration-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500 h-5 w-5" />
                <span>Pre-Trip Inspection for Truck #12345 completed.</span>
              </div>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </li>
            <li className="flex items-center justify-between p-3 border bg-card hover:bg-muted/50 transition-colors duration-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-accent h-5 w-5" />
                <span>Anomaly detected in Skid Steer #SS789 report.</span>
              </div>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </li>
             <li className="flex items-center justify-between p-3 border bg-card hover:bg-muted/50 transition-colors duration-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Edit3 className="text-primary h-5 w-5" />
                <span>VIN for new Trailer #TILT001 added.</span>
              </div>
              <span className="text-sm text-muted-foreground">3 days ago</span>
            </li>
          </ul>
           <p className="text-center text-muted-foreground mt-6">A live feed of recent reports would appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
