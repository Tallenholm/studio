
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, LineChart, Cog } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Oversee fleet assets, generate advanced reports, and configure system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Users className="text-primary" />
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
