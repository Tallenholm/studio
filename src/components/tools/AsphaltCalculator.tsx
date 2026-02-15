'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function AsphaltCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('3');
  const [density, setDensity] = useState('2.0');
  const calculate = () => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const T = parseFloat(thickness);
    const RHO = parseFloat(density);

    if (isNaN(L) || isNaN(W) || isNaN(T) || isNaN(RHO) || L <= 0 || W <= 0 || T <= 0 || RHO <= 0) {
      return null;
    }

    const cubicFeet = L * W * (T / 12);
    const yards = cubicFeet / 27;

    return {
      yards: Math.round(yards * 100) / 100,
      tons: Math.round(yards * RHO * 100) / 100,
    };
  };

  const result = calculate();

  const handleReset = () => {
    setLength('');
    setWidth('');
    setThickness('3');
    setDensity('2.0');
  };

  const results = result
    ? [
      { label: 'Estimated Asphalt Needed', value: `${result.yards.toFixed(2)} cubic yards`, isPrimary: true },
      { label: 'Weight', value: `~ ${result.tons.toFixed(2)} tons` },
    ]
    : null;

  return (
    <CalculatorShell
      calculatorName="Asphalt Calculator"
      results={results}
      onReset={handleReset}
      resultString={result ? `${result.yards.toFixed(2)} cubic yards (~${result.tons.toFixed(2)} tons)` : undefined}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="asphalt-length">Length (ft)</Label>
          <Input id="asphalt-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 100" aria-label="Paving length in feet" />
        </div>
        <div>
          <Label htmlFor="asphalt-width">Width (ft)</Label>
          <Input id="asphalt-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 20" aria-label="Paving width in feet" />
        </div>
        <div>
          <Label htmlFor="asphalt-thickness">Thickness (in)</Label>
          <Input id="asphalt-thickness" type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="e.g., 3" aria-label="Asphalt thickness in inches" />
        </div>
        <div>
          <Label htmlFor="asphalt-density">Density (tons/yd³)</Label>
          <Input id="asphalt-density" type="number" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g., 2.0" aria-label="Asphalt density" />
        </div>
      </div>
    </CalculatorShell>
  );
}
