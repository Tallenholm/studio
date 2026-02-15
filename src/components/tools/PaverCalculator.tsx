'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function PaverCalculator() {
  const [areaLength, setAreaLength] = useState('');
  const [areaWidth, setAreaWidth] = useState('');
  const [paverLength, setPaverLength] = useState('8');
  const [paverWidth, setPaverWidth] = useState('4');
  const [waste, setWaste] = useState('5');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const AL = parseFloat(areaLength);
    const AW = parseFloat(areaWidth);
    const PL = parseFloat(paverLength);
    const PW = parseFloat(paverWidth);
    const wastePercent = parseFloat(waste);

    if (isNaN(AL) || isNaN(AW) || isNaN(PL) || isNaN(PW) || isNaN(wastePercent) || AL <= 0 || AW <= 0 || PL <= 0 || PW <= 0 || wastePercent < 0) {
      setResult(null); return;
    }

    const numPavers = ((AL * 12) * (AW * 12)) / (PL * PW);
    setResult(Math.ceil(numPavers * (1 + wastePercent / 100)));
  }, [areaLength, areaWidth, paverLength, paverWidth, waste]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setAreaLength(''); setAreaWidth(''); setPaverLength('8'); setPaverWidth('4'); setWaste('5'); setResult(null);
  };

  const results = result !== null
    ? [
      { label: 'Estimated Pavers Needed', value: `${result.toLocaleString()} pavers`, isPrimary: true },
      { label: 'Waste', value: `includes ${waste}%` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Paver Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result.toLocaleString()} pavers (with ${waste}% waste)` : undefined}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="paver-area-length">Area Length (ft)</Label>
          <Input id="paver-area-length" type="number" value={areaLength} onChange={(e) => setAreaLength(e.target.value)} placeholder="e.g., 20" aria-label="Area length in feet" />
        </div>
        <div>
          <Label htmlFor="paver-area-width">Area Width (ft)</Label>
          <Input id="paver-area-width" type="number" value={areaWidth} onChange={(e) => setAreaWidth(e.target.value)} placeholder="e.g., 10" aria-label="Area width in feet" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="paver-waste">Waste (%)</Label>
          <Input id="paver-waste" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="e.g., 5" aria-label="Waste factor percentage" />
        </div>
        <div>
          <Label htmlFor="paver-length">Paver Length (in)</Label>
          <Input id="paver-length" type="number" value={paverLength} onChange={(e) => setPaverLength(e.target.value)} placeholder="e.g., 8" aria-label="Paver length in inches" />
        </div>
        <div>
          <Label htmlFor="paver-width">Paver Width (in)</Label>
          <Input id="paver-width" type="number" value={paverWidth} onChange={(e) => setPaverWidth(e.target.value)} placeholder="e.g., 4" aria-label="Paver width in inches" />
        </div>
      </div>
    </CalculatorShell>
  );
}
