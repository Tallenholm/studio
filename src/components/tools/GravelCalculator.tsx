'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CalculatorShell from '@/components/tools/CalculatorShell';

const aggregateTypes = [
  { value: 'custom', label: 'Custom Density', density: '1.4' },
  { value: 'pea_gravel', label: 'Pea Gravel / #8 Stone', density: '1.35' },
  { value: 'driveway_gravel', label: 'Driveway Gravel / #57 Stone', density: '1.45' },
  { value: 'road_base', label: 'Road Base / Crusher Run', density: '1.55' },
];

export default function GravelCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('4');
  const [aggregateType, setAggregateType] = useState('driveway_gravel');
  const [density, setDensity] = useState('1.45');
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  useEffect(() => {
    const selectedAggregate = aggregateTypes.find(agg => agg.value === aggregateType);
    if (selectedAggregate) setDensity(selectedAggregate.density);
  }, [aggregateType]);

  const calculate = useCallback(() => {
    const L = parseFloat(length);
    const W = parseFloat(width);
    const D = parseFloat(depth);
    const RHO = parseFloat(density);

    if (isNaN(L) || isNaN(W) || isNaN(D) || isNaN(RHO) || L <= 0 || W <= 0 || D <= 0 || RHO <= 0) {
      setResult(null);
      return;
    }

    const cubicFeet = L * W * (D / 12);
    const yards = cubicFeet / 27;
    setResult({
      yards: Math.round(yards * 100) / 100,
      tons: Math.round(yards * RHO * 100) / 100,
    });
  }, [length, width, depth, density]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setLength('');
    setWidth('');
    setDepth('4');
    setAggregateType('driveway_gravel');
    setDensity('1.45');
    setResult(null);
  };

  const results = result
    ? [
      { label: 'Estimated Gravel Needed', value: `${result.yards.toFixed(2)} cubic yards`, isPrimary: true },
      { label: 'Weight', value: `~ ${result.tons.toFixed(2)} tons` },
    ]
    : null;

  const resultString = result ? `${result.yards.toFixed(2)} cubic yards (~${result.tons.toFixed(2)} tons)` : undefined;

  return (
    <CalculatorShell calculatorName="Gravel Calculator" results={results} onReset={handleReset} resultString={resultString}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="aggregate-type">Gravel Type</Label>
          <Select value={aggregateType} onValueChange={setAggregateType}>
            <SelectTrigger id="aggregate-type" aria-label="Gravel type">
              <SelectValue placeholder="Select gravel type..." />
            </SelectTrigger>
            <SelectContent>
              {aggregateTypes.map(agg => (
                <SelectItem key={agg.value} value={agg.value}>{agg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gravel-length">Length (ft)</Label>
            <Input id="gravel-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 50" aria-label="Area length in feet" />
          </div>
          <div>
            <Label htmlFor="gravel-width">Width (ft)</Label>
            <Input id="gravel-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 12" aria-label="Area width in feet" />
          </div>
          <div>
            <Label htmlFor="gravel-depth">Depth (in)</Label>
            <Input id="gravel-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 4" aria-label="Gravel depth in inches" />
          </div>
          <div>
            <Label htmlFor="gravel-density">Density (tons/yd³)</Label>
            <Input id="gravel-density" type="number" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g., 1.45" aria-label="Material density" />
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
