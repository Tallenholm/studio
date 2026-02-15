'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function HaulageCalculator() {
  const [totalVolume, setTotalVolume] = useState('');
  const [truckCapacity, setTruckCapacity] = useState('12');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const volume = parseFloat(totalVolume);
    const capacity = parseFloat(truckCapacity);
    if (isNaN(volume) || isNaN(capacity) || volume <= 0 || capacity <= 0) { setResult(null); return; }
    setResult(Math.ceil(volume / capacity));
  }, [totalVolume, truckCapacity]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => { setTotalVolume(''); setTruckCapacity('12'); setResult(null); };

  const results = result !== null
    ? [{ label: 'Estimated Truck Loads', value: `${result.toLocaleString()} truck loads`, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Haulage Calculator" results={results} onReset={handleReset} resultString={result !== null ? `${result.toLocaleString()} truck loads` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="haul-volume">Total Volume (yd³)</Label>
          <Input id="haul-volume" type="number" value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} placeholder="e.g., 350" aria-label="Total volume in cubic yards" />
        </div>
        <div>
          <Label htmlFor="haul-capacity">Truck Capacity (yd³)</Label>
          <Input id="haul-capacity" type="number" value={truckCapacity} onChange={(e) => setTruckCapacity(e.target.value)} placeholder="e.g., 12" aria-label="Truck capacity in cubic yards" />
        </div>
      </div>
    </CalculatorShell>
  );
}
