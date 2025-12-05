
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function PavementSealerCalculator() {
  const [area, setArea] = useState('');
  const [coats, setCoats] = useState('2');
  const [coverage, setCoverage] = useState('100'); // Customizable coverage
  const [gallons, setGallons] = useState<number | null>(null);

  const calculate = () => {
    const A = parseFloat(area);
    const C = parseInt(coats, 10);
    const COV = parseFloat(coverage);

    if (isNaN(A) || isNaN(C) || isNaN(COV) || A <= 0 || C <= 0 || COV <= 0) {
      setGallons(null);
      return;
    }

    const totalArea = A * C;
    const totalGallons = totalArea / COV;

    setGallons(Math.ceil(totalGallons));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="sealer-area">Area (sq ft)</Label>
            <Input id="sealer-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., 2000" />
          </div>
          <div>
            <Label htmlFor="sealer-coats">Number of Coats</Label>
            <Input id="sealer-coats" type="number" value={coats} onChange={(e) => setCoats(e.target.value)} placeholder="e.g., 2" />
          </div>
           <div>
            <Label htmlFor="sealer-coverage">Coverage / Gallon (sq ft)</Label>
            <Input id="sealer-coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="e.g., 100" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Sealer</Button>
        {gallons !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Required Sealer</p>
              <p className="text-2xl font-bold text-primary">{gallons} gallons</p>
              <p className="text-xs text-muted-foreground">(approx. {gallons > 5 ? Math.ceil(gallons / 5) : 1} 5-gallon pails)</p>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Pavement Sealer" 
              resultString={`${gallons} gallons`} 
            />
          </>
        )}
    </div>
  );
}
