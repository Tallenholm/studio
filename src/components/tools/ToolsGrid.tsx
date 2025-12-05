
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

const toolCategories = [
    {
        category: "General & Conversion",
        icon: Scale,
        tools: [
            { id: 'unit-converter', title: 'Unit Converter', description: 'Convert common construction units.', icon: Scale, component: <UnitConverter /> },
        ]
    },
    {
        category: "Excavation & Earthwork",
        icon: Shovel,
        tools: [
            { id: 'excavation', title: 'Excavation Volume', description: 'Estimate bank and loose soil.', icon: Cuboid, component: <SoilVolumeCalculator /> },
            { id: 'trench', title: 'Trench Volume', description: 'Estimate excavation for a trench.', icon: Construction, component: <TrenchVolumeCalculator /> },
            { id: 'slope', title: 'Slope & Grade', description: 'Calculate slope, grade, and angle.', icon: TrendingUp, component: <SlopeCalculator /> },
            { id: 'retaining-wall', title: 'Retaining Wall', description: 'Estimate blocks needed.', icon: PanelTop, component: <RetainingWallCalculator /> },
        ]
    },
    {
        category: "Paving & Surfaces",
        icon: Route,
        tools: [
            { id: 'concrete', title: 'Concrete', description: 'Estimate cubic yards for a slab.', icon: Shovel, component: <ConcreteCalculator /> },
            { id: 'gravel', title: 'Gravel', description: 'Estimate volume and weight.', icon: Layers, component: <GravelCalculator /> },
            { id: 'asphalt', title: 'Asphalt', description: 'Estimate tons needed for paving.', icon: Route, component: <AsphaltCalculator /> },
            { id: 'sealer', title: 'Pavement Sealer', description: 'Estimate gallons of sealer.', icon: PaintRoller, component: <PavementSealerCalculator /> },
            { id: 'rebar', title: 'Rebar', description: 'Estimate linear feet for a slab.', icon: Grid3x3, component: <RebarCalculator /> },
            { id: 'paver', title: 'Pavers', description: 'Estimate pavers for a patio.', icon: LayoutGrid, component: <PaverCalculator /> },
        ]
    },
    {
        category: "Landscaping",
        icon: Sprout,
        tools: [
            { id: 'topsoil', title: 'Topsoil', description: 'Estimate volume and weight.', icon: Sprout, component: <TopsoilCalculator /> },
            { id: 'sod', title: 'Sod', description: 'Estimate sq. ft. of sod.', icon: Leaf, component: <SodCalculator /> },
            { id: 'mulch', title: 'Mulch', description: 'Estimate cubic yards of mulch.', icon: TreeDeciduous, component: <MulchCalculator /> },
        ]
    },
    {
        category: "Project Management",
        icon: Users,
        tools: [
            { id: 'labor-cost', title: 'Labor Cost', description: 'Estimate cost based on crew.', icon: Users, component: <LaborCostCalculator /> },
            { id: 'run-cost', title: 'Equipment Run Cost', description: 'Estimate total operating cost.', icon: Gauge, component: <EquipmentRunCostCalculator /> },
            { id: 'haulage', title: 'Haulage', description: 'Calculate truck loads needed.', icon: Container, component: <HaulageCalculator /> },
            { id: 'fuel-cost', title: 'Fuel Cost', description: 'Estimate fuel cost for a trip.', icon: Fuel, component: <FuelCostEstimator /> },
            { id: 'paint', title: 'Paint', description: 'Estimate gallons of paint.', icon: Paintbrush, component: <PaintCalculator /> },
        ]
    }
];


export default function ToolsGrid() {
  return (
    <Tabs defaultValue={toolCategories[0].category} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
             {toolCategories.map((category) => (
                 <TabsTrigger key={category.category} value={category.category} className="flex flex-col h-auto p-3 gap-2">
                    <category.icon className="h-6 w-6" />
                    <span className="text-center">{category.category}</span>
                </TabsTrigger>
             ))}
        </TabsList>

        {toolCategories.map((category) => (
             <TabsContent key={category.category} value={category.category} className="mt-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {category.tools.map((tool) => (
                     <Card key={tool.id} className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl h-full">
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
                 ))}
                 </div>
            </TabsContent>
        ))}
    </Tabs>
  );
}
