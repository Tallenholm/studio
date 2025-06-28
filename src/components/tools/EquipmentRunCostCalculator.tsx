
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EquipmentRunCostCalculator() {
  const [fuelCostPerHour, setFuelCostPerHour] = useState('');
  const [maintenanceCostPerHour, setMaintenanceCostPerHour] = useState('');
  const [operatorCostPerHour, setOperatorCostPerHour] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const fuel = parseFloat(fuelCostPerHour);
    const maint = parseFloat(maintenanceCostPerHour);
    const operator = parseFloat(operatorCostPerHour);
    const hours = parseFloat(totalHours);

    if (isNaN(hours) || hours <= 0) {
      setResult(null);
      return;
    }
    
    // Allow costs to be zero
    const totalHourlyCost = (isNaN(fuel) ? 0 : fuel) + (isNaN(maint) ? 0 : maint) + (isNaN(operator) ? 0 : operator);
    const totalCost = totalHourlyCost * hours;

    setResult(totalCost);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="equip-hours">Total Operating Hours</Label>
          <Input id="equip-hours" type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} placeholder="e.g., 80" />
        </div>
        <div>
          <Label htmlFor="equip-fuel">Fuel Cost / hr ($)</Label>
          <Input id="equip-fuel" type="number" value={fuelCostPerHour} onChange={(e) => setFuelCostPerHour(e.target.value)} placeholder="e.g., 15" />
        </div>
        <div>
          <Label htmlFor="equip-maint">Maint. Cost / hr ($)</Label>
          <Input id="equip-maint" type="number" value={maintenanceCostPerHour} onChange={(e) => setMaintenanceCostPerHour(e.target.value)} placeholder="e.g., 5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="equip-operator">Operator Cost / hr ($)</Label>
          <Input id="equip-operator" type="number" value={operatorCostPerHour} onChange={(e) => setOperatorCostPerHour(e.target.value)} placeholder="e.g., 30" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Run Cost</Button>
      {result !== null && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Estimated Total Equipment Run Cost</p>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(result)}
          </p>
        </div>
      )}
    </div>
  );
}
