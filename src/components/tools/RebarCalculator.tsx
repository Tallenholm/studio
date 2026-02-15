'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function RebarCalculator() {
  const [slabLength, setSlabLength] = useState('');
  const [slabWidth, setSlabWidth] = useState('');
  const [spacing, setSpacing] = useState('18');
  const [overlap, setOverlap] = useState('10');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(slabLength);
    const W = parseFloat(slabWidth);
    const S = parseFloat(spacing);
    const overlapPercent = parseFloat(overlap);

    if (isNaN(L) || isNaN(W) || isNaN(S) || L <= 0 || W <= 0 || S <= 0 || isNaN(overlapPercent) || overlapPercent < 0) {
      setResult(null); return;
    }

    const overlapFactor = 1 + (overlapPercent / 100);
    const numRows = Math.floor((W * 12) / S);
    const numCols = Math.floor((L * 12) / S);
    setResult(Math.ceil((numRows * L + numCols * W) * overlapFactor));
  }, [slabLength, slabWidth, spacing, overlap]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setSlabLength(''); setSlabWidth(''); setSpacing('18'); setOverlap('10'); setResult(null); };

  const results = result !== null
    ? [
      { label: 'Total Linear Feet of Rebar', value: `${result.toLocaleString()} ft`, isPrimary: true },
      { label: 'Overlap', value: `includes ${overlap}%` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Rebar Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result.toLocaleString()} ft (with ${overlap}% overlap)` : undefined}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rebar-length">Slab Length (ft)</Label>
          <Input id="rebar-length" type="number" value={slabLength} onChange={(e) => setSlabLength(e.target.value)} placeholder="e.g., 40" aria-label="Slab length in feet" />
        </div>
        <div>
          <Label htmlFor="rebar-width">Slab Width (ft)</Label>
          <Input id="rebar-width" type="number" value={slabWidth} onChange={(e) => setSlabWidth(e.target.value)} placeholder="e.g., 20" aria-label="Slab width in feet" />
        </div>
        <div>
          <Label htmlFor="rebar-spacing">Spacing (in)</Label>
          <Input id="rebar-spacing" type="number" value={spacing} onChange={(e) => setSpacing(e.target.value)} placeholder="e.g., 18" aria-label="Rebar spacing in inches" />
        </div>
        <div>
          <Label htmlFor="rebar-overlap">Overlap Factor (%)</Label>
          <Input id="rebar-overlap" type="number" value={overlap} onChange={(e) => setOverlap(e.target.value)} placeholder="e.g., 10" aria-label="Overlap factor percentage" />
        </div>
      </div>
    </CalculatorShell>
  );
}
