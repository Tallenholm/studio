'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function SlopeCalculator() {
  const [rise, setRise] = useState('');
  const [run, setRun] = useState('');
  const [result, setResult] = useState<{ grade: number; angle: number; ratio: string } | null>(null);

  const calculate = useCallback(() => {
    const R = parseFloat(rise);
    const U = parseFloat(run);
    if (isNaN(R) || isNaN(U) || U <= 0) { setResult(null); return; }

    const grade = (R / U) * 100;
    const angle = Math.atan(R / U) * (180 / Math.PI);
    const ratio = `1 : ${(U / R).toFixed(1)}`;

    setResult({
      grade: Math.round(grade * 100) / 100,
      angle: Math.round(angle * 100) / 100,
      ratio,
    });
  }, [rise, run]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setRise(''); setRun(''); setResult(null); };

  const results = result
    ? [
      { label: 'Grade', value: `${result.grade.toFixed(2)}%`, isPrimary: true },
      { label: 'Angle', value: `${result.angle.toFixed(1)}°` },
      { label: 'Ratio', value: result.ratio },
    ]
    : null;

  return (
    <CalculatorShell
      calculatorName="Slope Calculator"
      results={results}
      onReset={handleReset}
      resultString={result ? `Grade: ${result.grade.toFixed(2)}%, Angle: ${result.angle.toFixed(1)}°, Ratio: ${result.ratio}` : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slope-rise">Rise (ft)</Label>
          <Input id="slope-rise" type="number" value={rise} onChange={(e) => setRise(e.target.value)} placeholder="e.g., 2" aria-label="Elevation rise in feet" />
        </div>
        <div>
          <Label htmlFor="slope-run">Run (ft)</Label>
          <Input id="slope-run" type="number" value={run} onChange={(e) => setRun(e.target.value)} placeholder="e.g., 50" aria-label="Horizontal run in feet" />
        </div>
      </div>
    </CalculatorShell>
  );
}
