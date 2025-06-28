'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RebarCalculator() {
  const [slabLength, setSlabLength] = useState('');
  const [slabWidth, setSlabWidth] = useState('');
  const [spacing, setSpacing] = useState('18');
  const [overlap, setOverlap] = useState('10');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const L = parseFloat(slabLength);
    const W = parseFloat(slabWidth);
    const S = parseFloat(spacing);
    const overlapPercent = parseFloat(overlap);

    if (isNaN(L) || isNaN(W) || isNaN(S) || L <= 0 || W <= 0 || S <= 0 || isNaN(overlapPercent) || overlapPercent < 0) {
      setResult(null);
      return;
    }

    const overlapFactor = 1 + (overlapPercent / 100);

    const numRows = Math.floor((W * 12) / S);
    const lenRows = numRows * L;
    
    const numCols = Math.floor((L * 12) / S);
    const lenCols = numCols * W;
    
    const totalFeet = (lenRows + lenCols) * overlapFactor;

    setResult(Math.ceil(totalFeet));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rebar-length">Slab Length (ft)</Label>
            <Input id="rebar-length" type="number" value={slabLength} onChange={(e) => setSlabLength(e.target.value)} placeholder="e.g., 40" />
          </div>
          <div>
            <Label htmlFor="rebar-width">Slab Width (ft)</Label>
            <Input id="rebar-width" type="number" value={slabWidth} onChange={(e) => setSlabWidth(e.target.value)} placeholder="e.g., 20" />
          </div>
          <div>
            <Label htmlFor="rebar-spacing">Spacing (in)</Label>
            <Input id="rebar-spacing" type="number" value={spacing} onChange={(e) => setSpacing(e.target.value)} placeholder="e.g., 18" />
          </div>
          <div>
            <Label htmlFor="rebar-overlap">Overlap Factor (%)</Label>
            <Input id="rebar-overlap" type="number" value={overlap} onChange={(e) => setOverlap(e.target.value)} placeholder="e.g., 10" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Rebar</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Total Linear Feet of Rebar</p>
            <p className="text-2xl font-bold text-primary">{result.toLocaleString()} ft</p>
            <p className="text-xs text-muted-foreground">(includes {overlap}% for overlap)</p>
          </div>
        )}
    </div>
  );
}
