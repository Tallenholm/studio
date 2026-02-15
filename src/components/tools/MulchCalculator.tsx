'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function MulchCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('3');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);
    if (isNaN(L) || isNaN(W) || isNaN(D) || L <= 0 || W <= 0 || D <= 0) { setResult(null); return; }
    setResult(Math.round((L * W * (D / 12)) / 27 * 100) / 100);
  }, [length, width, depth]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setLength(''); setWidth(''); setDepth('3'); setResult(null); };

  const results = result !== null
    ? [{ label: 'Estimated Mulch Needed', value: `${result.toFixed(2)} cubic yards`, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Mulch Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result.toFixed(2)} cubic yards` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="mulch-length">Length (ft)</Label>
          <Input id="mulch-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 20" aria-label="Bed length in feet" />
        </div>
        <div>
          <Label htmlFor="mulch-width">Width (ft)</Label>
          <Input id="mulch-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 10" aria-label="Bed width in feet" />
        </div>
        <div>
          <Label htmlFor="mulch-depth">Depth (in)</Label>
          <Input id="mulch-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 3" aria-label="Mulch depth in inches" />
        </div>
      </div>
    </CalculatorShell>
  );
}
