'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RetainingWallCalculator() {
  const [wallLength, setWallLength] = useState('');
  const [wallHeight, setWallHeight] = useState('');
  const [blockLength, setBlockLength] = useState('16');
  const [blockHeight, setBlockHeight] = useState('6');
  const [result, setResult] = useState<number | null>(null);

  const WASTE_FACTOR = 1.05; // 5% for cuts/waste

  const calculate = () => {
    const WL = parseFloat(wallLength);
    const WH = parseFloat(wallHeight);
    const BL = parseFloat(blockLength);
    const BH = parseFloat(blockHeight);

    if (isNaN(WL) || isNaN(WH) || isNaN(BL) || isNaN(BH) || WL <= 0 || WH <= 0 || BL <= 0 || BH <= 0) {
      setResult(null);
      return;
    }

    const wallAreaSqInches = (WL * 12) * (WH * 12);
    const blockAreaSqInches = BL * BH;
    const numBlocks = (wallAreaSqInches / blockAreaSqInches) * WASTE_FACTOR;

    setResult(Math.ceil(numBlocks));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wall-length">Wall Length (ft)</Label>
          <Input id="wall-length" type="number" value={wallLength} onChange={(e) => setWallLength(e.target.value)} placeholder="e.g., 50" />
        </div>
        <div>
          <Label htmlFor="wall-height">Wall Height (ft)</Label>
          <Input id="wall-height" type="number" value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} placeholder="e.g., 4" />
        </div>
        <div>
          <Label htmlFor="block-length">Block Length (in)</Label>
          <Input id="block-length" type="number" value={blockLength} onChange={(e) => setBlockLength(e.target.value)} placeholder="e.g., 16" />
        </div>
        <div>
          <Label htmlFor="block-height">Block Height (in)</Label>
          <Input id="block-height" type="number" value={blockHeight} onChange={(e) => setBlockHeight(e.target.value)} placeholder="e.g., 6" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Blocks</Button>
      {result !== null && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Estimated Blocks Needed</p>
          <p className="text-2xl font-bold text-primary">{result.toLocaleString()} blocks</p>
          <p className="text-xs text-muted-foreground">(includes 5% waste)</p>
        </div>
      )}
    </div>
  );
}
