'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import SaveToJob from '@/components/tools/SaveToJob';

export default function RetainingWallCalculator() {
  const [wallLength, setWallLength] = useState('');
  const [wallHeight, setWallHeight] = useState('');
  const [blockLength, setBlockLength] = useState('16');
  const [blockHeight, setBlockHeight] = useState('6');
  const [waste, setWaste] = useState('5');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const WL = parseFloat(wallLength);
    const WH = parseFloat(wallHeight);
    const BL = parseFloat(blockLength);
    const BH = parseFloat(blockHeight);
    const wastePercent = parseFloat(waste);

    if (isNaN(WL) || isNaN(WH) || isNaN(BL) || isNaN(BH) || WL <= 0 || WH <= 0 || BL <= 0 || BH <= 0 || isNaN(wastePercent) || wastePercent < 0) {
      setResult(null);
      return;
    }
    
    const wasteFactor = 1 + (wastePercent / 100);
    const wallAreaSqInches = (WL * 12) * (WH * 12);
    const blockAreaSqInches = BL * BH;
    const numBlocks = (wallAreaSqInches / blockAreaSqInches) * wasteFactor;

    setResult(Math.ceil(numBlocks));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="sm:col-span-2">
            <Label htmlFor="wall-waste">Waste Factor (%)</Label>
            <Input id="wall-waste" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} placeholder="e.g., 5" />
        </div>
      </div>
      <Button type="button" onClick={calculate} className="w-full">Calculate Blocks</Button>
      {result !== null && (
        <>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Blocks Needed</p>
            <p className="text-2xl font-bold text-primary">{result.toLocaleString()} blocks</p>
            <p className="text-xs text-muted-foreground">(includes {waste}% waste)</p>
          </div>
          <Separator className="my-4" />
          <SaveToJob 
            calculatorName="Retaining Wall Blocks" 
            resultString={`${result.toLocaleString()} blocks (with ${waste}% waste)`} 
          />
        </>
      )}
    </div>
  );
}
