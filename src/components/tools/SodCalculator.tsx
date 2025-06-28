'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SodCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const WASTE_FACTOR = 1.10; // 10% waste for cuts and shaping

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);

    if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0) {
      setResult(null);
      return;
    }

    const area = L * W;
    const totalWithWaste = area * WASTE_FACTOR;

    setResult(Math.ceil(totalWithWaste));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sod-length">Area Length (ft)</Label>
          <Input id="sod-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 100" />
        </div>
        <div>
          <Label htmlFor="sod-width">Area Width (ft)</Label>
          <Input id="sod-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 50" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Sod</Button>
      {result !== null && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Estimated Sod Needed</p>
          <p className="text-2xl font-bold text-primary">{result.toLocaleString()} sq ft</p>
          <p className="text-xs text-muted-foreground">(includes 10% waste)</p>
        </div>
      )}
    </div>
  );
}
