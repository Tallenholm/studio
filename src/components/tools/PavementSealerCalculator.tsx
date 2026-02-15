'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function PavementSealerCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('100');
  const [gallons, setGallons] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);
    const COV = parseFloat(coverage);
    if (isNaN(A) || isNaN(C) || isNaN(COV) || A <= 0 || C <= 0 || COV <= 0) { setGallons(null); return; }
    setGallons(Math.ceil((A * C) / COV));
  }, [area, coats, coverage]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setArea(''); setCoats('2'); setCoverage('100'); setGallons(null); };

  const results = gallons !== null
    ? [
      { label: 'Required Sealer', value: `${gallons} gallons`, isPrimary: true },
      { label: 'Pails (5-gal)', value: `${gallons > 5 ? Math.ceil(gallons / 5) : 1} pails` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Pavement Sealer" results={results} onReset={handleReset} resultString={gallons !== null ? `${gallons} gallons` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sealer-area">Area (sq ft)</Label>
          <Input id="sealer-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 2000" aria-label="Surface area in square feet" />
        </div>
        <div>
          <Label htmlFor="sealer-coats">Number of Coats</Label>
          <Input id="sealer-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" aria-label="Number of coats" />
        </div>
        <div>
          <Label htmlFor="sealer-coverage">Coverage / Gallon (sq ft)</Label>
          <Input id="sealer-coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="e.g., 100" aria-label="Coverage per gallon" />
        </div>
      </div>
    </CalculatorShell>
  );
}
