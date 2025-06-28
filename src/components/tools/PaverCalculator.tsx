'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PaverCalculator() {
  const [areaLength, setAreaLength] = useState('');
  const [areaWidth, setAreaWidth] = useState('');
  const [paverLength, setPaverLength] = useState('8');
  const [paverWidth, setPaverWidth] = useState('4');
  const [result, setResult] = useState<number | null>(null);

  const WASTE_FACTOR = 1.05; // 5% waste

  const calculate = () => {
    const AL = parseFloat(areaLength);
    const AW = parseFloat(areaWidth);
    const PL = parseFloat(paverLength);
    const PW = parseFloat(paverWidth);

    if (isNaN(AL) || isNaN(AW) || isNaN(PL) || isNaN(PW) || AL <= 0 || AW <= 0 || PL <= 0 || PW <= 0) {
      setResult(null);
      return;
    }

    const areaSqInches = (AL * 12) * (AW * 12);
    const paverSqInches = PL * PW;
    const numPavers = areaSqInches / paverSqInches;
    const totalWithWaste = numPavers * WASTE_FACTOR;

    setResult(Math.ceil(totalWithWaste));
  };

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="paver-area-length">Area Length (ft)</Label>
                <Input id="paver-area-length" type="number" value={areaLength} onChange={(e) => setAreaLength(e.target.value)} placeholder="e.g., 20" />
            </div>
            <div>
                <Label htmlFor="paver-area-width">Area Width (ft)</Label>
                <Input id="paver-area-width" type="number" value={areaWidth} onChange={(e) => setAreaWidth(e.target.value)} placeholder="e.g., 10" />
            </div>
            <div>
                <Label htmlFor="paver-length">Paver Length (in)</Label>
                <Input id="paver-length" type="number" value={paverLength} onChange={(e) => setPaverLength(e.target.value)} placeholder="e.g., 8" />
            </div>
            <div>
                <Label htmlFor="paver-width">Paver Width (in)</Label>
                <Input id="paver-width" type="number" value={paverWidth} onChange={(e) => setPaverWidth(e.target.value)} placeholder="e.g., 4" />
            </div>
        </div>
        <Button type="button" onClick={calculate} className="w-full">Calculate Pavers</Button>
        {result !== null && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Estimated Pavers Needed</p>
            <p className="text-2xl font-bold text-primary">{result.toLocaleString()} pavers</p>
            <p className="text-xs text-muted-foreground">(includes 5% waste)</p>
          </div>
        )}
    </div>
  );
}
