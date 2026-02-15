'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function EquipmentRunCostCalculator() {
  const [fuelCostPerHour, setFuelCostPerHour] = useState('');
  const [maintenanceCostPerHour, setMaintenanceCostPerHour] = useState('');
  const [operatorCostPerHour, setOperatorCostPerHour] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const hours = parseFloat(totalHours);
    if (isNaN(hours) || hours <= 0) { setResult(null); return; }

    const fuel = parseFloat(fuelCostPerHour) || 0;
    const maint = parseFloat(maintenanceCostPerHour) || 0;
    const operator = parseFloat(operatorCostPerHour) || 0;
    setResult((fuel + maint + operator) * hours);
  }, [fuelCostPerHour, maintenanceCostPerHour, operatorCostPerHour, totalHours]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setFuelCostPerHour(''); setMaintenanceCostPerHour(''); setOperatorCostPerHour(''); setTotalHours(''); setResult(null);
  };

  const formattedResult = result !== null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result)
    : undefined;

  const results = formattedResult
    ? [{ label: 'Total Equipment Run Cost', value: formattedResult, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Equipment Run Cost" results={results} onReset={handleReset} resultString={formattedResult}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="equip-hours">Total Operating Hours</Label>
          <Input id="equip-hours" type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} placeholder="e.g., 80" aria-label="Total operating hours" />
        </div>
        <div>
          <Label htmlFor="equip-fuel">Fuel Cost / hr ($)</Label>
          <Input id="equip-fuel" type="number" value={fuelCostPerHour} onChange={(e) => setFuelCostPerHour(e.target.value)} placeholder="e.g., 15" aria-label="Fuel cost per hour" />
        </div>
        <div>
          <Label htmlFor="equip-maint">Maint. Cost / hr ($)</Label>
          <Input id="equip-maint" type="number" value={maintenanceCostPerHour} onChange={(e) => setMaintenanceCostPerHour(e.target.value)} placeholder="e.g., 5" aria-label="Maintenance cost per hour" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="equip-operator">Operator Cost / hr ($)</Label>
          <Input id="equip-operator" type="number" value={operatorCostPerHour} onChange={(e) => setOperatorCostPerHour(e.target.value)} placeholder="e.g., 30" aria-label="Operator cost per hour" />
        </div>
      </div>
    </CalculatorShell>
  );
}
