
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function SodCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [waste, setWaste] = useState('10');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const wastePercent = parseFloat(waste);

    if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0 || isNaN(wastePercent) || wastePercent < 0) {
      setResult(null);
      return;
    }

    const wasteFactor = 1 + (wastePercent / 100);
    const area = L * W;
    const totalWithWaste = area * wasteFactor;

    setResult(Math.ceil(totalWithWaste));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sod-length">Area Length (ft)</Label>
          <Input id="sod-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 100" />
        </div>
        <div>
          <Label htmlFor="sod-width">Area Width (ft)</Label>
          <Input id="sod-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 50" />
        </div>
         <div>
          <Label htmlFor="sod-waste">Waste Factor (%)</Label>
          <Input id="sod-waste" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="e.g., 10" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Sod</Button>
      {result !== null && (
        <>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Sod Needed</p>
            <p className="text-2xl font-bold text-primary">{result.toLocaleString()} sq ft</p>
            <p className="text-xs text-muted-foreground">(includes {waste}% waste)</p>
          </div>
          <Separator className="my-4" />
          <SaveToJob 
            calculatorName="Sod Calculator" 
            resultString={`${result.toLocaleString()} sq ft (with ${waste}% waste)`} 
          />
        </>
      )}
    </div>
  );
}
