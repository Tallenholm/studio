

'use client';

import type { Violation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface MyViolationsClientPageProps {
    initialViolations: Violation[];
}

function MyViolationsClientPage({ initialViolations }: MyViolationsClientPageProps) {
  const getViolationTypeLabel = (type: Violation['type']) => {
    switch(type) {
        case 'safety': return 'Safety';
        case 'conduct': return 'Conduct';
        case 'performance': return 'Performance';
        case 'other': return 'Other';
    }
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
        {initialViolations.length > 0 ? (
            <div className="space-y-4">
            {initialViolations.map(v => (
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
                <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-primary/70"/>
                <h3 className="text-xl font-semibold text-foreground">No Violations Found</h3>
                <p className="mt-2">You have a clean record.</p>
             </div>
        )}
      </section>
    </div>
  );
}

export default async function MyViolationsPage() {
    const { getViolations } = await import('@/lib/firestoreService');
    const { auth } = await import('@/firebase');
    const allViolations = await getViolations();
    const currentUserId = auth.currentUser?.uid;
    
    const initialViolations = currentUserId 
        ? allViolations
            .filter(v => v.employeeId === currentUserId)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
    
    return <MyViolationsClientPage initialViolations={initialViolations} />;
}
