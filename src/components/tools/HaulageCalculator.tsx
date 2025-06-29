
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function HaulageCalculator() {
  const [totalVolume, setTotalVolume] = useState('');
  const [truckCapacity, setTruckCapacity] = useState('12'); // Common dump truck capacity
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const volume = parseFloat(totalVolume);
    const capacity = parseFloat(truckCapacity);

    if (isNaN(volume) || isNaN(capacity) || volume <= 0 || capacity <= 0) {
      setResult(null);
      return;
    }

    const numLoads = Math.ceil(volume / capacity);
    setResult(numLoads);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="haul-volume">Total Volume (yd³)</Label>
          <Input id="haul-volume" type="number" value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} placeholder="e.g., 350" />
        </div>
        <div>
          <Label htmlFor="haul-capacity">Truck Capacity (yd³)</Label>
          <Input id="haul-capacity" type="number" value={truckCapacity} onChange={(e) => setTruckCapacity(e.target.value)} placeholder="e.g., 12" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Loads</Button>
      {result !== null && (
        <>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Number of Loads</p>
            <p className="text-2xl font-bold text-primary">{result.toLocaleString()} truck loads</p>
          </div>
          <Separator className="my-4" />
          <SaveToJob 
            calculatorName="Haulage Calculator" 
            resultString={`${result.toLocaleString()} truck loads`} 
          />
        </>
      )}
    </div>
  );
}
