
'use client';

import { useState, useEffect } from 'react';
import type { Violation } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getViolations } from '@/lib/firestoreService';

export default function MyViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchData() {
        if (user) {
            setIsLoading(true);
            const allViolations = await getViolations();
            const userViolations = allViolations
                .filter(v => v.employeeId === user.uid)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setViolations(userViolations);
            setIsLoading(false);
        }
    }
    fetchData();
  }, [user]);

  const getViolationTypeLabel = (type: Violation['type']) => {
    switch(type) {
        case 'safety': return 'Safety';
        case 'conduct': return 'Conduct';
        case 'performance': return 'Performance';
        case 'other': return 'Other';
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Your Records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <ShieldAlert className="h-8 w-8 text-primary" />
                My Violation Records
            </CardTitle>
            <CardDescription>
                This is a confidential record of your documented violations. This page is only visible to you and management.
            </CardDescription>
        </CardHeader>
      </Card>

      <section>
        {violations.length > 0 ? (
            <div className="space-y-4">
            {violations.map(v => (
                <Card key={v.id} className="p-4 bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                        <p className="font-bold text-lg">{getViolationTypeLabel(v.type)} Violation</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(v.date), 'PPP')}</p>
                    </div>
                    <div className="mt-2 space-y-2">
                      <p><strong className="font-medium text-foreground">Description:</strong> {v.description}</p>
                      <p><strong className="font-medium text-foreground">Action Taken:</strong> {v.actionTaken}</p>
                    </div>
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <ShieldAlert className="h-12 w-12 mx-auto mb-4"/>
                <p className="text-lg">You have no violation records.</p>
             </div>
        )}
      </section>
    </div>
  );
}
