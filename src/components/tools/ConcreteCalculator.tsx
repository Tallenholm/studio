'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function ConcreteCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('4'); // Default to 4 inches
  const [cubicYards, setCubicYards] = useState<number | null>(null);

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const T = parseFloat(thickness);

    if (isNaN(L) || isNaN(W) || isNaN(T) || L <= 0 || W <= 0 || T <= 0) {
      setCubicYards(null);
      return;
    }

    const cubicFeet = L * W * (T / 12);
    const yards = cubicFeet / 27;
    const roundedYards = Math.round(yards * 100) / 100; // Round to 2 decimal places

    setCubicYards(roundedYards);
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length">Length (ft)</Label>
            <Input id="length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 20" />
          </div>
          <div>
            <Label htmlFor="width">Width (ft)</Label>
            <Input id="width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 10" />
          </div>
          <div>
            <Label htmlFor="thickness">Thickness (in)</Label>
            <Input id="thickness" type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g., 4" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate</Button>
        {cubicYards !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Required Concrete</p>
              <p className="text-2xl font-bold text-primary">{cubicYards.toFixed(2)} cubic yards</p>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Concrete Calculator" 
              resultString={`${cubicYards.toFixed(2)} cubic yards`} 
            />
          </>
        )}
    </div>
  );
}
