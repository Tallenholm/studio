'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PavementSealerCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [gallons, setGallons] = useState<number | null>(null);

  const COVERAGE_PER_GALLON = 100; // sq ft per gallon

  const calculate = () => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);

    if (isNaN(A) || isNaN(C) || A <= 0 || C <= 0) {
      setGallons(null);
      return;
    }

    const totalArea = A * C;
    const totalGallons = totalArea / COVERAGE_PER_GALLON;

    setGallons(Math.ceil(totalGallons));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sealer-area">Area (sq ft)</Label>
            <Input id="sealer-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 2000" />
          </div>
          <div>
            <Label htmlFor="sealer-coats">Number of Coats</Label>
            <Input id="sealer-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Sealer</Button>
        {gallons !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Required Sealer</p>
            <p className="text-2xl font-bold text-primary">{gallons} gallons</p>
            <p className="text-xs text-muted-foreground">(approx. {gallons > 5 ? Math.ceil(gallons / 5) : 1} 5-gallon pails)</p>
          </div>
        )}
    </div>
  );
}
