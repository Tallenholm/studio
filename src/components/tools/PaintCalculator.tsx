'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function PaintCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('350');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);
    const COV = parseFloat(coverage);
    if (isNaN(A) || isNaN(C) || isNaN(COV) || A <= 0 || C <= 0 || COV <= 0) { setResult(null); return; }
    setResult(Math.ceil((A * C) / COV));
  }, [area, coats, coverage]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setArea(''); setCoats('2'); setCoverage('350'); setResult(null); };

  const results = result !== null
    ? [{ label: 'Estimated Paint Needed', value: `${result} gallons`, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Paint Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result} gallons` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="paint-area">Area (sq ft)</Label>
          <Input id="paint-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 400" aria-label="Surface area in square feet" />
        </div>
        <div>
          <Label htmlFor="paint-coats">Coats</Label>
          <Input id="paint-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" aria-label="Number of coats" />
        </div>
        <div>
          <Label htmlFor="paint-coverage">Coverage / Gallon (sq ft)</Label>
          <Input id="paint-coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="e.g., 350" aria-label="Coverage per gallon in square feet" />
        </div>
      </div>
    </CalculatorShell>
  );
}
