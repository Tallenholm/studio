
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function LaborCostCalculator() {
  const [numWorkers, setNumWorkers] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const workers = parseInt(numWorkers, 10);
    const numHours = parseFloat(hours);
    const rate = parseFloat(hourlyRate);

    if (isNaN(workers) || isNaN(numHours) || isNaN(rate) || workers <= 0 || numHours <= 0 || rate <= 0) {
      setResult(null);
      return;
    }

    const totalCost = workers * numHours * rate;
    setResult(totalCost);
  };

  const formattedResult = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="labor-workers"># of Workers</Label>
          <Input id="labor-workers" type="number" value={numWorkers} onChange={(e) => setNumWorkers(e.target.value)} placeholder="e.g., 3" />
        </div>
        <div>
          <Label htmlFor="labor-hours">Total Hours</Label>
          <Input id="labor-hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 40" />
        </div>
        <div>
          <Label htmlFor="labor-rate">Avg. Rate/hr ($)</Label>
          <Input id="labor-rate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g., 25" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Labor Cost</Button>
      {result !== null && (
        <>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Total Labor Cost</p>
            <p className="text-2xl font-bold text-primary">
              {formattedResult}
            </p>
          </div>
          <Separator className="my-4" />
          <SaveToJob 
            calculatorName="Labor Cost Calculator" 
            resultString={formattedResult} 
          />
        </>
      )}
    </div>
  );
}
