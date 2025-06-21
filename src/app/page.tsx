
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Truck, User } from 'lucide-react';

export default function HubSelectorPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <LayoutDashboard className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Fleet Check Hub</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Select your portal to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Truck className="text-primary" />
              Admin Portal
            </CardTitle>
            <CardDescription>
              Manage fleet assets, users, and daily vehicle inspection reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin" passHref>
              <Button className="w-full">Open Admin Dashboard</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <User className="text-primary" />
              Employee Portal
            </CardTitle>
            <CardDescription>
              Access your daily work tools, including vehicle inspections.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/employee" passHref>
                <Button className="w-full">Open Employee Hub</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
