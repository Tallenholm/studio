'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SoilVolumeCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [includeSwell, setIncludeSwell] = useState(true);
  const [result, setResult] = useState<{ bankYards: number; looseYards: number } | null>(null);

  const SWELL_FACTOR = 1.25; // Common swell factor for loose soil

  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);

    if (isNaN(L) || isNaN(W) || isNaN(D) || L <= 0 || W <= 0 || D <= 0) {
      setResult(null);
      return;
    }

    const cubicFeet = L * W * D;
    const bankYards = cubicFeet / 27;
    const looseYards = bankYards * SWELL_FACTOR;

    setResult({
        bankYards: Math.round(bankYards * 100) / 100,
        looseYards: Math.round(looseYards * 100) / 100
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="soil-length">Length (ft)</Label>
            <Input id="soil-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 40" />
          </div>
          <div>
            <Label htmlFor="soil-width">Width (ft)</Label>
            <Input id="soil-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 25" />
          </div>
          <div>
            <Label htmlFor="soil-depth">Depth (ft)</Label>
            <Input id="soil-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 8" />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
            <Switch id="swell-toggle" checked={includeSwell} onCheckedChange={setIncludeSwell} />
            <Label htmlFor="swell-toggle">Include 25% soil swell factor?</Label>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Soil Volume</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Bank (In-Ground) Volume</p>
            <p className="text-xl font-bold text-primary">{result.bankYards.toFixed(2)} cubic yards</p>
            {includeSwell && (
                <>
                    <p className="text-sm text-muted-foreground mt-2">Loose (Excavated) Volume</p>
                    <p className="text-2xl font-bold text-primary">{result.looseYards.toFixed(2)} cubic yards</p>
                </>
            )}
          </div>
        )}
    </div>
  );
}
