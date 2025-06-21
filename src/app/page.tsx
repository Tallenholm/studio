
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Truck, BookUser } from 'lucide-react';

export default function HubDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <LayoutDashboard className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Fleet Check Hub</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your central dashboard for all work-related tools and applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Truck className="text-primary" />
              Fleet Check App
            </CardTitle>
            <CardDescription>
              Manage fleet assets, users, and daily vehicle inspection reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin" passHref>
              <Button className="w-full">Open Fleet App</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-muted/30 opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <BookUser className="text-muted-foreground" />
              Document Center
            </CardTitle>
            <CardDescription>
              Access safety manuals, HR documents, and company policies. (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
