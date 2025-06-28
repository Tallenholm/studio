'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UnitCategory = 'length' | 'area' | 'volume' | 'weight';

const units = {
  length: [
    { value: 'feet', label: 'Feet' },
    { value: 'inches', label: 'Inches' },
    { value: 'meters', label: 'Meters' },
    { value: 'yards', label: 'Yards' },
  ],
  area: [
    { value: 'sq_feet', label: 'Square Feet' },
    { value: 'sq_yards', label: 'Square Yards' },
    { value: 'acres', label: 'Acres' },
  ],
  volume: [
    { value: 'cubic_feet', label: 'Cubic Feet' },
    { value: 'cubic_yards', label: 'Cubic Yards' },
  ],
  weight: [
    { value: 'pounds', label: 'Pounds' },
    { value: 'tons', label: 'Tons (US)' },
    { value: 'kilograms', label: 'Kilograms' },
  ],
};

const conversionFactors: Record<string, number> = {
  // Length (base: feet)
  feet: 1,
  inches: 1 / 12,
  meters: 3.28084,
  yards: 3,
  // Area (base: sq_feet)
  sq_feet: 1,
  sq_yards: 9,
  acres: 43560,
  // Volume (base: cubic_feet)
  cubic_feet: 1,
  cubic_yards: 27,
  // Weight (base: pounds)
  pounds: 1,
  tons: 2000,
  kilograms: 2.20462,
};


export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(units['length'][0].value);
  const [toUnit, setToUnit] = useState(units['length'][1].value);
  const [result, setResult] = useState<string | null>(null);

  const availableUnits = useMemo(() => units[category], [category]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    setFromUnit(units[newCategory][0].value);
    setToUnit(units[newCategory][1].value);
    setInputValue('');
    setResult(null);
  }

  const convert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResult(null);
      return;
    }

    const valueInBaseUnit = value * conversionFactors[fromUnit];
    const convertedValue = valueInBaseUnit / conversionFactors[toUnit];

    setResult(convertedValue.toLocaleString(undefined, { maximumFractionDigits: 4 }));
  };
  
  useEffect(() => {
    convert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fromUnit, toUnit, category]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="unit-category">Conversion Type</Label>
        <Select value={category} onValueChange={(val) => handleCategoryChange(val as UnitCategory)}>
          <SelectTrigger id="unit-category">
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="length">Length</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="weight">Weight</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from-value">From</Label>
          <Input id="from-value" type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="e.g., 10" />
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map(unit => (
                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
            <Label htmlFor="to-value">To</Label>
            <Input id="to-value" disabled value={result ?? '...'} className="font-bold text-primary" />
            <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="mt-2">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableUnits.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}
