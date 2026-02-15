'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function ConcreteCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('4');
  const [cubicYards, setCubicYards] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const T = parseFloat(thickness);

    if (isNaN(L) || isNaN(W) || isNaN(T) || L <= 0 || W <= 0 || T <= 0) {
      setCubicYards(null);
      return;
    }

    const cubicFeet = L * W * (T / 12);
    setCubicYards(Math.round((cubicFeet / 27) * 100) / 100);
  }, [length, width, thickness]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setThickness('4');
    setCubicYards(null);
  };

  const results = cubicYards !== null
    ? [{ label: 'Required Concrete', value: `${cubicYards.toFixed(2)} cubic yards`, isPrimary: true }]
    : null;

  return (
    <CalculatorShell
      calculatorName="Concrete Calculator"
      results={results}
      onReset={handleReset}
      resultString={cubicYards !== null ? `${cubicYards.toFixed(2)} cubic yards` : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="concrete-length">Length (ft)</Label>
          <Input id="concrete-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 20" aria-label="Slab length in feet" />
        </div>
        <div>
          <Label htmlFor="concrete-width">Width (ft)</Label>
          <Input id="concrete-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 10" aria-label="Slab width in feet" />
        </div>
        <div>
          <Label htmlFor="concrete-thickness">Thickness (in)</Label>
          <Input id="concrete-thickness" type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g., 4" aria-label="Slab thickness in inches" />
        </div>
      </div>
    </CalculatorShell>
  );
}
