'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function TopsoilCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('6');
  const [density, setDensity] = useState('1.1');
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);
    const RHO = parseFloat(density);
    if (isNaN(L) || isNaN(W) || isNaN(D) || isNaN(RHO) || L <= 0 || W <= 0 || D <= 0 || RHO <= 0) { setResult(null); return; }

    const yards = (L * W * (D / 12)) / 27;
    setResult({
      yards: Math.round(yards * 100) / 100,
      tons: Math.round(yards * RHO * 100) / 100,
    });
  }, [length, width, depth, density]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setLength(''); setWidth(''); setDepth('6'); setDensity('1.1'); setResult(null); };

  const results = result
    ? [
      { label: 'Estimated Topsoil Needed', value: `${result.yards.toFixed(2)} cubic yards`, isPrimary: true },
      { label: 'Weight', value: `~ ${result.tons.toFixed(2)} tons` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Topsoil Calculator" results={results} onReset={handleReset} resultString={result ? `${result.yards.toFixed(2)} cubic yards (~${result.tons.toFixed(2)} tons)` : undefined}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="topsoil-length">Length (ft)</Label>
          <Input id="topsoil-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 50" aria-label="Area length in feet" />
        </div>
        <div>
          <Label htmlFor="topsoil-width">Width (ft)</Label>
          <Input id="topsoil-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 25" aria-label="Area width in feet" />
        </div>
        <div>
          <Label htmlFor="topsoil-depth">Depth (in)</Label>
          <Input id="topsoil-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 6" aria-label="Topsoil depth in inches" />
        </div>
        <div>
          <Label htmlFor="topsoil-density">Density (tons/yd³)</Label>
          <Input id="topsoil-density" type="number" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g., 1.1" aria-label="Topsoil density" />
        </div>
      </div>
    </CalculatorShell>
  );
}
