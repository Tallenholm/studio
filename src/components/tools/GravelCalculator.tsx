'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GravelCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('4'); // Default to 4 inches
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  const GRAVEL_DENSITY = 1.4; // tons per cubic yard, a common estimate

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
    const tons = yards * GRAVEL_DENSITY;

    setResult({
        yards: Math.round(yards * 100) / 100,
        tons: Math.round(tons * 100) / 100
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="gravel-length">Length (ft)</Label>
            <Input id="gravel-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 50" />
          </div>
          <div>
            <Label htmlFor="gravel-width">Width (ft)</Label>
            <Input id="gravel-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 12" />
          </div>
          <div>
            <Label htmlFor="gravel-depth">Depth (in)</Label>
            <Input id="gravel-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 4" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Gravel</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Gravel Needed</p>
            <p className="text-2xl font-bold text-primary">{result.yards.toFixed(2)} cubic yards</p>
            <p className="text-lg text-muted-foreground">~ {result.tons.toFixed(2)} tons</p>
          </div>
        )}
    </div>
  );
}
