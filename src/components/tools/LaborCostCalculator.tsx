'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function LaborCostCalculator() {
  const [numWorkers, setNumWorkers] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const workers = parseInt(numWorkers, 10);
    const numHours = parseFloat(hours);
    const rate = parseFloat(hourlyRate);

    if (isNaN(workers) || isNaN(numHours) || isNaN(rate) || workers <= 0 || numHours <= 0 || rate <= 0) {
      setResult(null);
      return;
    }

    setResult(workers * numHours * rate);
  }, [numWorkers, hours, hourlyRate]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setNumWorkers('');
    setHours('');
    setHourlyRate('');
    setResult(null);
  };

  const formattedResult = result !== null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result)
    : undefined;

  const results = formattedResult
    ? [{ label: 'Estimated Total Labor Cost', value: formattedResult, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Labor Cost Calculator" results={results} onReset={handleReset} resultString={formattedResult}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="labor-workers"># of Workers</Label>
          <Input id="labor-workers" type="number" value={numWorkers} onChange={(e) => setNumWorkers(e.target.value)} placeholder="e.g., 3" aria-label="Number of workers" />
        </div>
        <div>
          <Label htmlFor="labor-hours">Total Hours</Label>
          <Input id="labor-hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 40" aria-label="Total working hours" />
        </div>
        <div>
          <Label htmlFor="labor-rate">Avg. Rate/hr ($)</Label>
          <Input id="labor-rate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g., 25" aria-label="Average hourly rate" />
        </div>
      </div>
    </CalculatorShell>
  );
}
