'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AsphaltCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('3'); // Common thickness
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  const ASPHALT_DENSITY = 2.0; // tons per cubic yard

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const T = parseFloat(thickness);

    if (isNaN(L) || isNaN(W) || isNaN(T) || L <= 0 || W <= 0 || T <= 0) {
      setResult(null);
      return;
    }

    const cubicFeet = L * W * (T / 12);
    const yards = cubicFeet / 27;
    const tons = yards * ASPHALT_DENSITY;

    setResult({
        yards: Math.round(yards * 100) / 100,
        tons: Math.round(tons * 100) / 100
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="asphalt-length">Length (ft)</Label>
            <Input id="asphalt-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 100" />
          </div>
          <div>
            <Label htmlFor="asphalt-width">Width (ft)</Label>
            <Input id="asphalt-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 20" />
          </div>
          <div>
            <Label htmlFor="asphalt-thickness">Thickness (in)</Label>
            <Input id="asphalt-thickness" type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g., 3" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Asphalt</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Asphalt Needed</p>
            <p className="text-2xl font-bold text-primary">{result.yards.toFixed(2)} cubic yards</p>
            <p className="text-lg text-muted-foreground">~ {result.tons.toFixed(2)} tons</p>
          </div>
        )}
    </div>
  );
}
