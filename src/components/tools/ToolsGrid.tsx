
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shovel, Fuel, Layers, Cuboid, Route, PaintRoller, Sprout, TrendingUp, Construction, Paintbrush, Grid3x3, PanelTop, Leaf, LayoutGrid, TreeDeciduous, Users, Gauge, Container, Scale } from 'lucide-react';

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
import UnitConverter from '@/components/tools/UnitConverter';

const tools = [
  { id: 'unit-converter', title: 'Unit Converter', description: 'Convert common construction units.', icon: Scale, component: <UnitConverter /> },
  { id: 'concrete', title: 'Concrete', description: 'Estimate cubic yards for a slab.', icon: Shovel, component: <ConcreteCalculator /> },
  { id: 'gravel', title: 'Gravel', description: 'Estimate volume and weight.', icon: Layers, component: <GravelCalculator /> },
  { id: 'topsoil', title: 'Topsoil', description: 'Estimate volume and weight.', icon: Sprout, component: <TopsoilCalculator /> },
  { id: 'excavation', title: 'Excavation Volume', description: 'Estimate bank and loose soil.', icon: Cuboid, component: <SoilVolumeCalculator /> },
  { id: 'trench', title: 'Trench Volume', description: 'Estimate excavation for a trench.', icon: Construction, component: <TrenchVolumeCalculator /> },
  { id: 'slope', title: 'Slope & Grade', description: 'Calculate slope, grade, and angle.', icon: TrendingUp, component: <SlopeCalculator /> },
  { id: 'asphalt', title: 'Asphalt', description: 'Estimate tons needed for paving.', icon: Route, component: <AsphaltCalculator /> },
  { id: 'sealer', title: 'Pavement Sealer', description: 'Estimate gallons of sealer.', icon: PaintRoller, component: <PavementSealerCalculator /> },
  { id: 'rebar', title: 'Rebar', description: 'Estimate linear feet for a slab.', icon: Grid3x3, component: <RebarCalculator /> },
  { id: 'retaining-wall', title: 'Retaining Wall', description: 'Estimate blocks needed.', icon: PanelTop, component: <RetainingWallCalculator /> },
  { id: 'paver', title: 'Pavers', description: 'Estimate pavers for a patio.', icon: LayoutGrid, component: <PaverCalculator /> },
  { id: 'sod', title: 'Sod', description: 'Estimate sq. ft. of sod.', icon: Leaf, component: <SodCalculator /> },
  { id: 'mulch', title: 'Mulch', description: 'Estimate cubic yards of mulch.', icon: TreeDeciduous, component: <MulchCalculator /> },
  { id: 'paint', title: 'Paint', description: 'Estimate gallons of paint.', icon: Paintbrush, component: <PaintCalculator /> },
  { id: 'fuel-cost', title: 'Fuel Cost', description: 'Estimate fuel cost for a trip.', icon: Fuel, component: <FuelCostEstimator /> },
  { id: 'labor-cost', title: 'Labor Cost', description: 'Estimate cost based on crew.', icon: Users, component: <LaborCostCalculator /> },
  { id: 'run-cost', title: 'Equipment Run Cost', description: 'Estimate total operating cost.', icon: Gauge, component: <EquipmentRunCostCalculator /> },
  { id: 'haulage', title: 'Haulage', description: 'Calculate truck loads needed.', icon: Container, component: <HaulageCalculator /> },
];


export default function ToolsGrid() {
  return (
    <Tabs defaultValue={tools[0].id} orientation="vertical" className="flex flex-col md:flex-row gap-6 md:gap-8">
      <TabsList className="grid grid-cols-2 md:grid-cols-1 md:h-auto md:w-64 shrink-0 justify-start">
        {tools.map((tool) => (
          <TabsTrigger key={tool.id} value={tool.id} className="w-full justify-start gap-3 px-3 py-2 text-base">
            <tool.icon className="h-5 w-5" />
            <span>{tool.title}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="flex-1 min-w-0">
        {tools.map((tool) => (
          <TabsContent key={tool.id} value={tool.id} className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0">
             <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl h-full">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-3 text-2xl">
                        <tool.icon className="h-7 w-7 text-primary" />
                        {tool.title}
                    </CardTitle>
                    <CardDescription>
                        {tool.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {tool.component}
                </CardContent>
            </Card>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
