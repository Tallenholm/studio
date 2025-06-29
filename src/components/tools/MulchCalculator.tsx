'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function MulchCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('3');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);

    if (isNaN(L) || isNaN(W) || isNaN(D) || L <= 0 || W <= 0 || D <= 0) {
      setResult(null);
      return;
    }

    const cubicFeet = L * W * (D / 12);
    const yards = cubicFeet / 27;

    setResult(Math.round(yards * 100) / 100);
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="mulch-length">Length (ft)</Label>
            <Input id="mulch-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 20" />
          </div>
          <div>
            <Label htmlFor="mulch-width">Width (ft)</Label>
            <Input id="mulch-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 10" />
          </div>
          <div>
            <Label htmlFor="mulch-depth">Depth (in)</Label>
            <Input id="mulch-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 3" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Mulch</Button>
        {result !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Estimated Mulch Needed</p>
              <p className="text-2xl font-bold text-primary">{result.toFixed(2)} cubic yards</p>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Mulch Calculator" 
              resultString={`${result.toFixed(2)} cubic yards`} 
            />
          </>
        )}
    </div>
  );
}
