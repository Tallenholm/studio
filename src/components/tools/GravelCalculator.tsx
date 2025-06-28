'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const aggregateTypes = [
    { value: 'custom', label: 'Custom Density', density: '1.4' },
    { value: 'pea_gravel', label: 'Pea Gravel / #8 Stone', density: '1.35' },
    { value: 'driveway_gravel', label: 'Driveway Gravel / #57 Stone', density: '1.45' },
    { value: 'road_base', label: 'Road Base / Crusher Run', density: '1.55' },
];

export default function GravelCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('4'); // Default to 4 inches
  const [aggregateType, setAggregateType] = useState('driveway_gravel');
  const [density, setDensity] = useState('1.45'); // Corresponds to driveway_gravel
  const [result, setResult] = useState<{ yards: number; tons: number } | null>(null);

  useEffect(() => {
    const selectedAggregate = aggregateTypes.find(agg => agg.value === aggregateType);
    if (selectedAggregate) {
      setDensity(selectedAggregate.density);
    }
  }, [aggregateType]);

  const calculate = () => {
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
    const tons = yards * RHO;

    setResult({
        yards: Math.round(yards * 100) / 100,
        tons: Math.round(tons * 100) / 100
    });
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div>
            <Label htmlFor="aggregate-type">Gravel Type</Label>
            <Select value={aggregateType} onValueChange={setAggregateType}>
                <SelectTrigger id="aggregate-type">
                    <SelectValue placeholder="Select gravel type..." />
                </SelectTrigger>
                <SelectContent>
                    {aggregateTypes.map(agg => (
                        <SelectItem key={agg.value} value={agg.value}>{agg.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gravel-length">Length (ft)</Label>
            <Input id="gravel-length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g., 50" />
          </div>
          <div>
            <Label htmlFor="gravel-width">Width (ft)</Label>
            <Input id="gravel-width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g., 12" />
          </div>
          <div>
            <Label htmlFor="gravel-depth">Depth (in)</Label>
            <Input id="gravel-depth" type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="e.g., 4" />
          </div>
           <div>
            <Label htmlFor="gravel-density">Density (tons/yd³)</Label>
            <Input id="gravel-density" type="number" value={density} onChange={(e) => setDensity(e.target.value)} placeholder="e.g., 1.45" />
          </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Gravel</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Gravel Needed</p>
            <p className="text-2xl font-bold text-primary">{result.yards.toFixed(2)} cubic yards</p>
            <p className="text-lg text-muted-foreground">~ {result.tons.toFixed(2)} tons</p>
          </div>
        )}
    </div>
  );
}
