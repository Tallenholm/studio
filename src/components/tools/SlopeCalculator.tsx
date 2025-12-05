
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function SlopeCalculator() {
  const [rise, setRise] = useState('');
  const [run, setRun] = useState('');
  const [result, setResult] = useState<{ grade: number; angle: number, ratio: string } | null>(null);

  const calculate = () => {
    const R = parseFloat(rise);
    const U = parseFloat(run);

    if (isNaN(R) || isNaN(U) || U <= 0) {
      setResult(null);
      return;
    }

    const grade = (R / U) * 100;
    const angle = Math.atan(R / U) * (180 / Math.PI);
    
    // Calculate ratio, e.g., 1:4
    const ratioValue = U/R;
    const ratio = `1 : ${ratioValue.toFixed(1)}`;

    setResult({
        grade: Math.round(grade * 100) / 100,
        angle: Math.round(angle * 100) / 100,
        ratio
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="slope-rise">Rise (ft)</Label>
            <Input id="slope-rise" type="number" value={rise} onChange={(e) => setRise(e.target.value)} placeholder="e.g., 2" />
          </div>
          <div>
            <Label htmlFor="slope-run">Run (ft)</Label>
            <Input id="slope-run" type="number" value={run} onChange={(e) => setRun(e.target.value)} placeholder="e.g., 50" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Slope</Button>
        {result !== null && (
          <>
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">Calculated Slope</p>
              <div className="flex justify-around items-center mt-2">
                  <div>
                      <p className="text-2xl font-bold text-primary">{result.grade.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">Grade</p>
                  </div>
                  <div>
                      <p className="text-2xl font-bold text-primary">{result.angle.toFixed(1)}°</p>
                      <p className="text-xs text-muted-foreground">Angle</p>
                  </div>
                   <div>
                      <p className="text-2xl font-bold text-primary">{result.ratio}</p>
                      <p className="text-xs text-muted-foreground">Ratio</p>
                  </div>
              </div>
            </div>
            <Separator className="my-4" />
            <SaveToJob 
              calculatorName="Slope Calculator" 
              resultString={`Grade: ${result.grade.toFixed(2)}%, Angle: ${result.angle.toFixed(1)}°, Ratio: ${result.ratio}`} 
            />
          </>
        )}
    </div>
  );
}
