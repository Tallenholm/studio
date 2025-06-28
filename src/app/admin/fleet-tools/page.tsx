
'use client';

import ToolsGrid from '@/components/tools/ToolsGrid';

export default function FleetToolsPage() {
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Fleet Operations Tools</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Quick calculators and utilities to help with planning and quoting.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <ToolsGrid />
      </div>
    </div>
  );
}
