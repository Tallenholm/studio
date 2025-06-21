
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sunrise, Sunset } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function EmployeePortalPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-headline font-bold mb-4">Welcome, {user?.name || 'Employee'}!</h1>
      <p className="text-2xl text-muted-foreground mb-12">
        Let's get your inspection started.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/pre-trip" passHref>
          <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer">
            <CardHeader className="p-2">
              <Sunrise className="h-24 w-24 text-primary mx-auto mb-4" />
              <CardTitle className="text-4xl font-headline">
                Pre-Trip Inspection
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Complete this before you start your day.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 mt-4">
               <Button size="lg" className="text-xl py-7 px-10">Start</Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/post-trip" passHref>
           <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer">
            <CardHeader className="p-2">
              <Sunset className="h-24 w-24 text-primary mx-auto mb-4" />
              <CardTitle className="text-4xl font-headline">
                Post-Trip Inspection
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Complete this when your day is done.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 mt-4">
              <Button size="lg" className="text-xl py-7 px-10">Start</Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
