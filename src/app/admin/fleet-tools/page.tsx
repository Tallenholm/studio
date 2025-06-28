
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shovel, Fuel } from 'lucide-react';
import ConcreteCalculator from '@/components/tools/ConcreteCalculator';
import FuelCostEstimator from '@/components/tools/FuelCostEstimator';

export default function FleetToolsPage() {
  
  const handleConcreteCalculation = (yards: number) => {
    // This function is a placeholder if you want the parent page
    // to react to a calculation. For now, the component is self-contained.
    console.log(`Concrete calculated: ${yards} cubic yards`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Fleet Operations Tools</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Quick calculators and utilities to help with planning and quoting.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* Concrete Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Shovel className="h-6 w-6 text-primary" />
              Concrete Calculator
            </CardTitle>
            <CardDescription>
              Estimate the cubic yards of concrete needed for a rectangular slab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConcreteCalculator onCalculate={handleConcreteCalculation} />
          </CardContent>
        </Card>

        {/* Fuel Cost Estimator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Fuel className="h-6 w-6 text-primary" />
              Fuel Cost Estimator
            </CardTitle>
            <CardDescription>
              Estimate the fuel cost for a given trip or job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelCostEstimator />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
