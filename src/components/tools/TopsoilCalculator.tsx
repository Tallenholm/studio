'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function TopsoilCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('6'); // Default to 6 inches
  const [density, setDensity] = useState('1.1'); // Customizable density
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);
    const RHO = parseFloat(density);

    if (isNaN(L) || isNaN(W) || isNaN(D) || isNaN(RHO) || L <= 0 || W <= 0 || D <= 0 || RHO <= 0) {
      setResult(null);
      return;
    }

    const cubicFeet = L * W * (D / 12);
    const yards = cubicFeet / 27;
    const tons = yards * RHO;

    setResult({
        yards: Math.round(yards * 100) / 100,
        tons: Math.round(tons * 100) / 100
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="topsoil-length">Length (ft)</Label>
            <Input id="topsoil-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 50" />
          </div>
          <div>
            <Label htmlFor="topsoil-width">Width (ft)</Label>
            <Input id="topsoil-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 25" />
          </div>
          <div>
            <Label htmlFor="topsoil-depth">Depth (in)</Label>
            <Input id="topsoil-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 6" />
          </div>
          <div>
            <Label htmlFor="topsoil-density">Density (tons/yd³)</Label>
            <Input id="topsoil-density" type="number" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g., 1.1" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Topsoil</Button>
        {result !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Estimated Topsoil Needed</p>
              <p className="text-2xl font-bold text-primary">{result.yards.toFixed(2)} cubic yards</p>
              <p className="text-lg text-muted-foreground">~ {result.tons.toFixed(2)} tons</p>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Topsoil Calculator" 
              resultString={`${result.yards.toFixed(2)} cubic yards (~${result.tons.toFixed(2)} tons)`} 
            />
          </>
        )}
    </div>
  );
}
