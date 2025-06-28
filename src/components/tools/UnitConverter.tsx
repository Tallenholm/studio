
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';

type UnitCategory = 'length' | 'area' | 'volume' | 'weight' | 'pressure' | 'temperature';

const units: Record<UnitCategory, { value: string, label: string }[]> = {
  length: [
    { value: 'feet', label: 'Feet (ft)' },
    { value: 'inches', label: 'Inches (in)' },
    { value: 'yards', label: 'Yards (yd)' },
    { value: 'miles', label: 'Miles (mi)' },
    { value: 'meters', label: 'Meters (m)' },
    { value: 'centimeters', label: 'Centimeters (cm)' },
    { value: 'millimeters', label: 'Millimeters (mm)' },
    { value: 'kilometers', label: 'Kilometers (km)' },
  ],
  area: [
    { value: 'sq_feet', label: 'Square Feet (ft²)' },
    { value: 'sq_inches', label: 'Square Inches (in²)' },
    { value: 'sq_yards', label: 'Square Yards (yd²)' },
    { value: 'sq_meters', label: 'Square Meters (m²)' },
    { value: 'acres', label: 'Acres' },
    { value: 'hectares', label: 'Hectares' },
    { value: 'sq_miles', label: 'Square Miles (mi²)' },
  ],
  volume: [
    { value: 'cubic_feet', label: 'Cubic Feet (ft³)' },
    { value: 'cubic_yards', label: 'Cubic Yards (yd³)' },
    { value: 'cubic_meters', label: 'Cubic Meters (m³)' },
    { value: 'gallons_us', label: 'Gallons (US)' },
    { value: 'liters', label: 'Liters' },
    { value: 'fluid_ounces_us', label: 'Fluid Ounces (US)' },
  ],
  weight: [
    { value: 'pounds', label: 'Pounds (lb)' },
    { value: 'ounces', label: 'Ounces (oz)' },
    { value: 'tons_us', label: 'Tons (US)' },
    { value: 'kilograms', label: 'Kilograms (kg)' },
    { value: 'metric_tons', label: 'Metric Tons (t)' },
  ],
  pressure: [
    { value: 'psi', label: 'PSI' },
    { value: 'kpa', label: 'Kilopascals (kPa)' },
    { value: 'bar', label: 'Bar' },
  ],
  temperature: [
    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
    { value: 'celsius', label: 'Celsius (°C)' },
  ],
};

const conversionFactors: Record<string, number> = {
  // Length (base: feet)
  feet: 1,
  inches: 1 / 12,
  yards: 3,
  miles: 5280,
  meters: 3.28084,
  kilometers: 3280.84,
  centimeters: 0.0328084,
  millimeters: 0.00328084,
  // Area (base: sq_feet)
  sq_feet: 1,
  sq_inches: 1 / 144,
  sq_yards: 9,
  sq_meters: 10.7639,
  acres: 43560,
  hectares: 107639,
  sq_miles: 27878400,
  // Volume (base: cubic_feet)
  cubic_feet: 1,
  cubic_yards: 27,
  gallons_us: 0.133681,
  liters: 0.0353147,
  cubic_meters: 35.3147,
  fluid_ounces_us: 0.00104438,
  // Weight (base: pounds)
  pounds: 1,
  ounces: 1 / 16,
  tons_us: 2000,
  kilograms: 2.20462,
  metric_tons: 2204.62,
  // Pressure (base: psi)
  psi: 1,
  kpa: 0.145038,
  bar: 14.5038,
};

function convertTemperature(value: number, from: string, to: string): number {
  if (from === to) return value;
  if (from === 'celsius' && to === 'fahrenheit') {
    return (value * 9/5) + 32;
  }
  if (from === 'fahrenheit' && to === 'celsius') {
    return (value - 32) * 5/9;
  }
  return value; // Should not happen
}

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(units['length'][0].value);
  const [toUnit, setToUnit] = useState(units['length'][1].value);
  const [result, setResult] = useState<string | null>(null);

  const availableUnits = useMemo(() => units[category], [category]);

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const newUnits = units[newCategory];
    setFromUnit(newUnits[0].value);
    // Set 'to' unit to the second one if available, otherwise the first
    setToUnit(newUnits.length > 1 ? newUnits[1].value : newUnits[0].value);
    setInputValue('');
    setResult(null);
  }

  const handleSwapUnits = () => {
    if (result === null) return;
    
    // Swap the units
    const newFrom = toUnit;
    const newTo = fromUnit;
    
    setFromUnit(newFrom);
    setToUnit(newTo);
    
    // The result becomes the new input value
    const resultAsNumberString = parseFloat(result.replace(/,/g, '')).toString();
    setInputValue(resultAsNumberString);
};

  useEffect(() => {
    const convert = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) {
        setResult(null);
        return;
        }

        let convertedValue: number;

        if (category === 'temperature') {
        convertedValue = convertTemperature(value, fromUnit, toUnit);
        } else {
        const valueInBaseUnit = value * conversionFactors[fromUnit];
        convertedValue = valueInBaseUnit / conversionFactors[toUnit];
        }
        
        setResult(convertedValue.toLocaleString(undefined, { maximumFractionDigits: 4 }));
    };
    convert();
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
            <SelectItem value="pressure">Pressure</SelectItem>
            <SelectItem value="temperature">Temperature</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <div className="w-full space-y-2">
          <Label htmlFor="from-value">From</Label>
          <Input id="from-value" type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter value" />
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map(unit => (
                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-shrink-0 pt-7">
            <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSwapUnits}
            aria-label="Swap units"
            >
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
        </div>

        <div className="w-full space-y-2">
            <Label htmlFor="to-value">To</Label>
            <Input id="to-value" disabled value={result ?? '...'} className="font-bold text-primary bg-muted/30" />
            <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger>
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
