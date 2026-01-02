
'use client';

import ToolsGrid from '@/components/tools/ToolsGrid';
import { Calculator } from 'lucide-react';

export default function FleetToolsPage() {
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <Calculator className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Calculators</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A suite of calculators for project estimation and planning.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <ToolsGrid />
      </div>
    </div>
  );
}
