
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud } from 'lucide-react';

export default function WeatherForecast() {
    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Weather Center</CardTitle>
                <CardDescription>
                   For a detailed forecast, live radar, and daily conditions, please visit the new Weather Center page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/weather">
                        <Cloud className="mr-2 h-5 w-5" />
                        Go to Weather Center
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
