'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PaintCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [result, setResult] = useState<number | null>(null);

  const COVERAGE_PER_GALLON = 350; // sq ft per gallon, a common estimate

  const calculate = () => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);

    if (isNaN(A) || isNaN(C) || A <= 0 || C <= 0) {
      setResult(null);
      return;
    }

    const totalGallons = (A * C) / COVERAGE_PER_GALLON;

    setResult(Math.ceil(totalGallons));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paint-area">Area to Paint (sq ft)</Label>
            <Input id="paint-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 400" />
          </div>
          <div>
            <Label htmlFor="paint-coats">Number of Coats</Label>
            <Input id="paint-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Paint</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Paint Needed</p>
            <p className="text-2xl font-bold text-primary">{result} gallons</p>
          </div>
        )}
    </div>
  );
}
