'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorShell from '@/components/tools/CalculatorShell';

export default function RetainingWallCalculator() {
  const [wallLength, setWallLength] = useState('');
  const [wallHeight, setWallHeight] = useState('');
  const [blockLength, setBlockLength] = useState('16');
  const [blockHeight, setBlockHeight] = useState('6');
  const [waste, setWaste] = useState('5');
  const [result, setResult] = useState<number | null>(null);

  const calculate = useCallback(() => {
    const WL = parseFloat(wallLength);
    const WH = parseFloat(wallHeight);
    const BL = parseFloat(blockLength);
    const BH = parseFloat(blockHeight);
    const wastePercent = parseFloat(waste);

    if (isNaN(WL) || isNaN(WH) || isNaN(BL) || isNaN(BH) || WL <= 0 || WH <= 0 || BL <= 0 || BH <= 0 || isNaN(wastePercent) || wastePercent < 0) {
      setResult(null); return;
    }

    const numBlocks = ((WL * 12) * (WH * 12)) / (BL * BH) * (1 + wastePercent / 100);
    setResult(Math.ceil(numBlocks));
  }, [wallLength, wallHeight, blockLength, blockHeight, waste]);

  useEffect(() => { calculate(); }, [calculate]);

  const handleReset = () => {
    setWallLength(''); setWallHeight(''); setBlockLength('16'); setBlockHeight('6'); setWaste('5'); setResult(null);
  };

  const results = result !== null
    ? [
      { label: 'Estimated Blocks Needed', value: `${result.toLocaleString()} blocks`, isPrimary: true },
      { label: 'Waste', value: `includes ${waste}%` },
    ]
    : null;

  return (
    <CalculatorShell calculatorName="Retaining Wall Blocks" results={results} onReset={handleReset} resultString={result !== null ? `${result.toLocaleString()} blocks (with ${waste}% waste)` : undefined}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wall-length">Wall Length (ft)</Label>
          <Input id="wall-length" type="number" value={wallLength} onChange={(e) => setWallLength(e.target.value)} placeholder="e.g., 50" aria-label="Wall length in feet" />
        </div>
        <div>
          <Label htmlFor="wall-height">Wall Height (ft)</Label>
          <Input id="wall-height" type="number" value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} placeholder="e.g., 4" aria-label="Wall height in feet" />
        </div>
        <div>
          <Label htmlFor="block-length">Block Length (in)</Label>
          <Input id="block-length" type="number" value={blockLength} onChange={(e) => setBlockLength(e.target.value)} placeholder="e.g., 16" aria-label="Block length in inches" />
        </div>
        <div>
          <Label htmlFor="block-height">Block Height (in)</Label>
          <Input id="block-height" type="number" value={blockHeight} onChange={(e) => setBlockHeight(e.target.value)} placeholder="e.g., 6" aria-label="Block height in inches" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="wall-waste">Waste Factor (%)</Label>
          <Input id="wall-waste" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="e.g., 5" aria-label="Waste factor percentage" />
        </div>
      </div>
    </CalculatorShell>
  );
}
