'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function PaintCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('350');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);
    const COV = parseFloat(coverage);

    if (isNaN(A) || isNaN(C) || isNaN(COV) || A <= 0 || C <= 0 || COV <= 0) {
      setResult(null);
      return;
    }

    const totalGallons = (A * C) / COV;

    setResult(Math.ceil(totalGallons));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="paint-area">Area (sq ft)</Label>
            <Input id="paint-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 400" />
          </div>
          <div>
            <Label htmlFor="paint-coats">Coats</Label>
            <Input id="paint-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" />
          </div>
          <div>
            <Label htmlFor="paint-coverage">Coverage / Gallon (sq ft)</Label>
            <Input id="paint-coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="e.g., 350" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Paint</Button>
        {result !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Estimated Paint Needed</p>
              <p className="text-2xl font-bold text-primary">{result} gallons</p>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Paint Calculator" 
              resultString={`${result} gallons`} 
            />
          </>
        )}
    </div>
  );
}
