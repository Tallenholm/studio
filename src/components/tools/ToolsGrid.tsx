
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shovel, Fuel, Layers, Cuboid, Route, PaintRoller, Sprout, TrendingUp, Construction, Paintbrush, Grid3x3, PanelTop, Leaf, LayoutGrid, TreeDeciduous, Users, Gauge, Container } from 'lucide-react';
import ConcreteCalculator from '@/components/tools/ConcreteCalculator';
import FuelCostEstimator from '@/components/tools/FuelCostEstimator';
import GravelCalculator from '@/components/tools/GravelCalculator';
import SoilVolumeCalculator from '@/components/tools/SoilVolumeCalculator';
import AsphaltCalculator from '@/components/tools/AsphaltCalculator';
import TopsoilCalculator from '@/components/tools/TopsoilCalculator';
import PavementSealerCalculator from '@/components/tools/PavementSealerCalculator';
import TrenchVolumeCalculator from '@/components/tools/TrenchVolumeCalculator';
import SlopeCalculator from '@/components/tools/SlopeCalculator';
import RebarCalculator from '@/components/tools/RebarCalculator';
import RetainingWallCalculator from '@/components/tools/RetainingWallCalculator';
import PaverCalculator from '@/components/tools/PaverCalculator';
import SodCalculator from '@/components/tools/SodCalculator';
import MulchCalculator from '@/components/tools/MulchCalculator';
import PaintCalculator from '@/components/tools/PaintCalculator';
import LaborCostCalculator from '@/components/tools/LaborCostCalculator';
import EquipmentRunCostCalculator from '@/components/tools/EquipmentRunCostCalculator';
import HaulageCalculator from '@/components/tools/HaulageCalculator';


export default function ToolsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <Route className="h-6 w-6 text-primary" />
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

      {/* Rebar Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Grid3x3 className="h-6 w-6 text-primary" />
            Rebar Calculator
          </CardTitle>
          <CardDescription>
            Estimate the linear feet of rebar needed for a concrete slab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RebarCalculator />
        </CardContent>
      </Card>
      
      {/* Retaining Wall Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <PanelTop className="h-6 w-6 text-primary" />
            Retaining Wall Calculator
          </CardTitle>
          <CardDescription>
            Estimate the number of blocks needed for a retaining wall.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RetainingWallCalculator />
        </CardContent>
      </Card>
      
      {/* Paver Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            Paver Calculator
          </CardTitle>
          <CardDescription>
            Estimate the number of pavers for a patio or walkway.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaverCalculator />
        </CardContent>
      </Card>
      
      {/* Sod Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            Sod Calculator
          </CardTitle>
          <CardDescription>
            Estimate the square feet of sod needed for an area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SodCalculator />
        </CardContent>
      </Card>
      
      {/* Mulch Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <TreeDeciduous className="h-6 w-6 text-primary" />
            Mulch Calculator
          </CardTitle>
          <CardDescription>
            Estimate the cubic yards of mulch for a garden bed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MulchCalculator />
        </CardContent>
      </Card>
      
      {/* Paint Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Paintbrush className="h-6 w-6 text-primary" />
            Paint Calculator
          </CardTitle>
          <CardDescription>
            Estimate the gallons of paint needed for a surface area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaintCalculator />
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

      {/* Labor Cost Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Labor Cost Calculator
          </CardTitle>
          <CardDescription>
            Estimate total labor cost based on crew size, hours, and rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LaborCostCalculator />
        </CardContent>
      </Card>

      {/* Equipment Run Cost Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            Equipment Run Cost Calculator
          </CardTitle>
          <CardDescription>
            Estimate the total cost of operating a piece of equipment for a job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentRunCostCalculator />
        </CardContent>
      </Card>
      
      {/* Haulage Calculator */}
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Container className="h-6 w-6 text-primary" />
            Haulage Calculator
          </CardTitle>
          <CardDescription>
            Calculate the number of truck loads required to move material.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HaulageCalculator />
        </CardContent>
      </Card>

    </div>
  );
}
