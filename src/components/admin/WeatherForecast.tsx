
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CloudRain } from 'lucide-react';

export default function WeatherForecast() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5" />
          Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Weather forecast data is currently unavailable.</p>
      </CardContent>
    </Card>
  );
}
