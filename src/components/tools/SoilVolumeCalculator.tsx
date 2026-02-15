'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function SoilVolumeCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [swell, setSwell] = useState('25');
  const [result, setResult] = useState<{ bankYards: number; looseYards: number } | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);
    const swellPercent = parseFloat(swell);

    if (isNaN(L) || isNaN(W) || isNaN(D) || L <= 0 || W <= 0 || D <= 0 || isNaN(swellPercent) || swellPercent < 0) {
      setResult(null);
      return;
    }

    const swellFactor = 1 + (swellPercent / 100);
    const cubicFeet = L * W * D;
    const bankYards = cubicFeet / 27;
    setResult({
      bankYards: Math.round(bankYards * 100) / 100,
      looseYards: Math.round(bankYards * swellFactor * 100) / 100,
    });
  }, [length, width, depth, swell]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setDepth('');
    setSwell('25');
    setResult(null);
  };

  const results = result
    ? [
      { label: 'Loose (Excavated) Volume', value: `${result.looseYards.toFixed(2)} cubic yards`, isPrimary: true },
      { label: 'Bank (In-Ground)', value: `${result.bankYards.toFixed(2)} cubic yards` },
      { label: 'Swell', value: `${swell}%` },
    ]
    : null;

  return (
    <CalculatorShell
      calculatorName="Excavation Volume"
      results={results}
      onReset={handleReset}
      resultString={result ? `Bank: ${result.bankYards.toFixed(2)} yd³, Loose: ${result.looseYards.toFixed(2)} yd³` : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="soil-length">Length (ft)</Label>
          <Input id="soil-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 40" aria-label="Excavation length in feet" />
        </div>
        <div>
          <Label htmlFor="soil-width">Width (ft)</Label>
          <Input id="soil-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 25" aria-label="Excavation width in feet" />
        </div>
        <div>
          <Label htmlFor="soil-depth">Depth (ft)</Label>
          <Input id="soil-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 8" aria-label="Excavation depth in feet" />
        </div>
        <div>
          <Label htmlFor="soil-swell">Swell Factor (%)</Label>
          <Input id="soil-swell" type="number" value={swell} onChange={(e) => setSwell(e.target.value)} placeholder="e.g., 25" aria-label="Soil swell factor percentage" />
        </div>
      </div>
    </CalculatorShell>
  );
}
