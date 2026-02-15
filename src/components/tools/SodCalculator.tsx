'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function SodCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [waste, setWaste] = useState('10');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const wastePercent = parseFloat(waste);
    if (isNaN(L) || isNaN(W) || L <= 0 || W <= 0 || isNaN(wastePercent) || wastePercent < 0) { setResult(null); return; }
    setResult(Math.ceil(L * W * (1 + wastePercent / 100)));
  }, [length, width, waste]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setLength(''); setWidth(''); setWaste('10'); setResult(null); };

  const results = result !== null
    ? [
      { label: 'Estimated Sod Needed', value: `${result.toLocaleString()} sq ft`, isPrimary: true },
      { label: 'Waste', value: `includes ${waste}%` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Sod Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result.toLocaleString()} sq ft (with ${waste}% waste)` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sod-length">Area Length (ft)</Label>
          <Input id="sod-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 100" aria-label="Area length in feet" />
        </div>
        <div>
          <Label htmlFor="sod-width">Area Width (ft)</Label>
          <Input id="sod-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 50" aria-label="Area width in feet" />
        </div>
        <div>
          <Label htmlFor="sod-waste">Waste Factor (%)</Label>
          <Input id="sod-waste" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="e.g., 10" aria-label="Waste factor percentage" />
        </div>
      </div>
    </CalculatorShell>
  );
}
