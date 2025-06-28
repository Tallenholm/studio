'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shovel, Fuel, Layers, Cuboid, Road, PaintRoller, Sprout, TrendingUp, Construction } from 'lucide-react';
import ConcreteCalculator from '@/components/tools/ConcreteCalculator';
import FuelCostEstimator from '@/components/tools/FuelCostEstimator';
import GravelCalculator from '@/components/tools/GravelCalculator';
import SoilVolumeCalculator from '@/components/tools/SoilVolumeCalculator';
import AsphaltCalculator from '@/components/tools/AsphaltCalculator';
import TopsoilCalculator from '@/components/tools/TopsoilCalculator';
import PavementSealerCalculator from '@/components/tools/PavementSealerCalculator';
import TrenchVolumeCalculator from '@/components/tools/TrenchVolumeCalculator';
import SlopeCalculator from '@/components/tools/SlopeCalculator';

export default function FleetToolsPage() {
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Fleet Operations Tools</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Quick calculators and utilities to help with planning and quoting.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
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
            <ConcreteCalculator />
          </CardContent>
        </Card>

        {/* Gravel Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Gravel Calculator
            </CardTitle>
            <CardDescription>
              Estimate the volume (yd³) and weight (tons) of gravel for an area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GravelCalculator />
          </CardContent>
        </Card>
        
        {/* Topsoil Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" />
              Topsoil Calculator
            </CardTitle>
            <CardDescription>
              Estimate the volume (yd³) and weight (tons) of topsoil required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopsoilCalculator />
          </CardContent>
        </Card>

        {/* Soil Volume Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Cuboid className="h-6 w-6 text-primary" />
              Excavation Volume Calculator
            </CardTitle>
            <CardDescription>
              Estimate the volume of soil to be excavated from an area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoilVolumeCalculator />
          </CardContent>
        </Card>
        
        {/* Trench Volume Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Construction className="h-6 w-6 text-primary" />
              Trench Volume Calculator
            </CardTitle>
            <CardDescription>
              Estimate excavation volume for a trench.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrenchVolumeCalculator />
          </CardContent>
        </Card>
        
        {/* Slope & Grade Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Slope & Grade Calculator
            </CardTitle>
            <CardDescription>
              Calculate the slope, grade, and angle between two points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SlopeCalculator />
          </CardContent>
        </Card>

        {/* Asphalt Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Road className="h-6 w-6 text-primary" />
              Asphalt Calculator
            </CardTitle>
            <CardDescription>
              Estimate the tons of asphalt needed for paving projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsphaltCalculator />
          </CardContent>
        </Card>
        
        {/* Pavement Sealer Calculator Card */}
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <PaintRoller className="h-6 w-6 text-primary" />
              Pavement Sealer Calculator
            </CardTitle>
            <CardDescription>
              Estimate gallons of sealer needed for a given area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PavementSealerCalculator />
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
