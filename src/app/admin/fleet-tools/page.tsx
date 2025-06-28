
'use client';

import ToolsGrid from '@/components/tools/ToolsGrid';

export default function FleetToolsPage() {
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Operations Toolkit</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A comprehensive suite of calculators for project estimation and planning.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <ToolsGrid />
      </div>
    </div>
  );
}
