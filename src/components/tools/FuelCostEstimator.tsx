'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function FuelCostEstimator() {
  const [distance, setDistance] = useState('');
  const [mpg, setMpg] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [totalCost, setTotalCost] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const dist = parseFloat(distance);
    const efficiency = parseFloat(mpg);
    const price = parseFloat(pricePerGallon);

    if (isNaN(dist) || isNaN(efficiency) || isNaN(price) || dist <= 0 || efficiency <= 0 || price <= 0) {
      setTotalCost(null);
      return;
    }

    setTotalCost((dist / efficiency) * price);
  }, [distance, mpg, pricePerGallon]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setDistance('');
    setMpg('');
    setPricePerGallon('');
    setTotalCost(null);
  };

  const formattedResult = totalCost !== null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)
    : undefined;

  const results = formattedResult
    ? [{ label: 'Estimated Fuel Cost', value: formattedResult, isPrimary: true }]
    : null;

  return (
    <CalculatorShell calculatorName="Fuel Cost Estimator" results={results} onReset={handleReset} resultString={formattedResult}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="fuel-distance">Distance (miles)</Label>
          <Input id="fuel-distance" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="e.g., 300" aria-label="Trip distance in miles" />
        </div>
        <div>
          <Label htmlFor="fuel-mpg">Fuel Efficiency (MPG)</Label>
          <Input id="fuel-mpg" type="number" value={mpg} onChange={(e) => setMpg(e.target.value)} placeholder="e.g., 8" aria-label="Miles per gallon" />
        </div>
        <div>
          <Label htmlFor="fuel-price">Price per Gallon ($)</Label>
          <Input id="fuel-price" type="number" value={pricePerGallon} onChange={(e) => setPricePerGallon(e.target.value)} placeholder="e.g., 3.50" aria-label="Fuel price per gallon" />
        </div>
      </div>
    </CalculatorShell>
  );
}
