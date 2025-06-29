
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function FuelCostEstimator() {
  const [distance, setDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [totalCost, setTotalCost] = useState<number | null>(null);

  const calculate = () => {
    const dist = parseFloat(distance);
    const efficiency = parseFloat(mpg);
    const price = parseFloat(pricePerGallon);

    if (isNaN(dist) || isNaN(efficiency) || isNaN(price) || dist <= 0 || efficiency <= 0 || price <= 0) {
      setTotalCost(null);
      return;
    }

    const gallonsNeeded = dist / efficiency;
    const cost = gallonsNeeded * price;

    setTotalCost(cost);
  };
  
  const formattedResult = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="distance">Distance (miles)</Label>
          <Input id="distance" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="e.g., 300" />
        </div>
        <div>
          <Label htmlFor="mpg">Fuel Efficiency (MPG)</Label>
          <Input id="mpg" type="number" value={mpg} onChange={(e) => setMpg(e.target.value)} placeholder="e.g., 8" />
        </div>
        <div>
          <Label htmlFor="price">Price per Gallon ($)</Label>
          <Input id="price" type="number" value={pricePerGallon} onChange={(e) => setPricePerGallon(e.target.value)} placeholder="e.g., 3.50" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Cost</Button>
      {totalCost !== null && (
        <>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Fuel Cost</p>
            <p className="text-2xl font-bold text-primary">
              {formattedResult}
            </p>
          </div>
          <Separator className="my-4" />
          <SaveToJob 
            calculatorName="Fuel Cost Estimator" 
            resultString={formattedResult} 
          />
        </>
      )}
    </div>
  );
}
