
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Cog, Truck, FileText, UserCheck } from 'lucide-react';

export default function FleetCheckDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <Truck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Fleet Check Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Oversee fleet assets, users, reports, and settings for the Fleet Check app.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <FileText className="text-primary" />
              View Reports
            </CardTitle>
            <CardDescription>
              Review all past inspection reports and their AI analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports" passHref>
              <Button className="w-full">Go to Reports</Button>
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
              View, add, or edit the vehicles and equipment in your fleet.
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
              <Users className="text-primary" />
              Manage Users
            </CardTitle>
            <CardDescription>
              Add, view, and remove employee user accounts and PINs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/manage-users" passHref>
              <Button className="w-full">Go to User Management</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <LineChart className="text-primary" />
              Advanced Reports
            </CardTitle>
            <CardDescription>
              Analyze trends, component failures, and inspection history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/advanced-reports" passHref>
              <Button className="w-full">Go to Advanced Reports</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Cog className="text-primary" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure application settings and data management options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/system-settings" passHref>
              <Button className="w-full">Go to System Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
