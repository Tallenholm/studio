'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, CloudSun, Loader2, AlertTriangle, Wind, Droplets, Thermometer } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// These should match the WeatherForecast component
const LATITUDE = 41.1200;
const LONGITUDE = -87.8612;

interface ForecastPeriod {
    number: number;
    name: string;
    startTime: string;
    endTime: string;
    isDaytime: boolean;
    temperature: number;
    temperatureUnit: string;
    windSpeed: string;
    windDirection: string;
    icon: string;
    shortForecast: string;
    detailedForecast: string;
    probabilityOfPrecipitation?: { value: number | null };
    relativeHumidity?: { value: number | null };
}

const getWeatherIcon = (iconUrl: string, isDaytime: boolean) => {
    const forecast = iconUrl.toLowerCase();
    if (forecast.includes('snow')) return <Snowflake className="h-10 w-10 text-blue-300" />;
    if (forecast.includes('rain') || forecast.includes('showers')) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (forecast.includes('tsra') || forecast.includes('thunder')) return <CloudLightning className="h-10 w-10 text-yellow-500" />;
    if (forecast.includes('wind')) return <Wind className="h-10 w-10 text-gray-400" />;
    if (forecast.includes('sunny') || forecast.includes('clear')) return isDaytime ? <Sun className="h-10 w-10 text-yellow-400" /> : <Sun className="h-10 w-10 text-gray-400" />; // Should be moon icon, but sun works
    if (forecast.includes('partly') || forecast.includes('mostly') || forecast.includes('sct') || forecast.includes('few')) return <CloudSun className="h-10 w-10 text-gray-400" />;
    if (forecast.includes('cloudy') || forecast.includes('bkn') || forecast.includes('ovc')) return <Cloud className="h-10 w-10 text-gray-500" />;
    return <Thermometer className="h-10 w-10 text-gray-400" />;
};


export default function WeatherPage() {
    const [dailyForecast, setDailyForecast] = useState<ForecastPeriod[] | null>(null);
    const [hourlyForecast, setHourlyForecast] = useState<ForecastPeriod[] | null>(null);
    const [locationName, setLocationName] = useState('your location');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const pointsResponse = await fetch(`https://api.weather.gov/points/${LATITUDE},${LONGITUDE}`);
                if (!pointsResponse.ok) throw new Error('Could not fetch weather location data.');
                const pointsData = await pointsResponse.json();

                const dailyUrl = pointsData.properties.forecast;
                const hourlyUrl = pointsData.properties.forecastHourly;
                const locationCity = pointsData.properties.relativeLocation.properties.city;
                const locationState = pointsData.properties.relativeLocation.properties.state;
                setLocationName(`${locationCity}, ${locationState}`);

                const [dailyRes, hourlyRes] = await Promise.all([fetch(dailyUrl), fetch(hourlyUrl)]);
                if (!dailyRes.ok || !hourlyRes.ok) throw new Error('Could not fetch forecast data.');

                const dailyData = await dailyRes.json();
                const hourlyData = await hourlyRes.json();

                setDailyForecast(dailyData.properties.periods);
                setHourlyForecast(hourlyData.properties.periods);
                setError(null);
            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Full Forecast...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <Card className="max-w-lg mx-auto mt-10 text-center bg-card/90 backdrop-blur-xl border-destructive/50">
                <CardHeader>
                    <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl font-headline">Weather Unavailable</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Weather Forecast for {locationName}</CardTitle>
                    <CardDescription>Detailed hourly and 7-day weather information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="daily">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="daily">7-Day Forecast</TabsTrigger>
                            <TabsTrigger value="hourly">Hourly Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="daily" className="mt-4">
                             <div className="space-y-4">
                                {dailyForecast?.map(period => (
                                    <div key={period.number} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                        <div className="flex-shrink-0 w-full sm:w-32 text-center">
                                            <p className="font-bold text-lg">{period.name}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getWeatherIcon(period.icon, period.isDaytime)}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-lg">{period.shortForecast}</p>
                                            <p className="text-sm text-muted-foreground">{period.detailedForecast}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-center">
                                            <p className={`text-2xl font-bold ${period.isDaytime ? 'text-primary' : 'text-blue-400'}`}>{period.temperature}°{period.temperatureUnit}</p>
                                            <p className="text-sm text-muted-foreground">{period.windSpeed} {period.windDirection}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="hourly" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {hourlyForecast?.map(period => (
                                    <div key={period.startTime} className="p-4 border rounded-lg bg-muted/50 flex flex-col gap-2 text-center">
                                        <p className="font-bold">{format(parseISO(period.startTime), 'eee ha')}</p>
                                        {getWeatherIcon(period.icon, period.isDaytime)}
                                        <p className="text-3xl font-bold text-primary">{period.temperature}°</p>
                                        <p className="text-sm font-semibold h-10">{period.shortForecast}</p>
                                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                                            <p>{period.windSpeed} {period.windDirection}</p>
                                            {period.probabilityOfPrecipitation?.value !== null && <p>Precip: {period.probabilityOfPrecipitation?.value}%</p>}
                                            {period.relativeHumidity?.value !== null && <p>Humidity: {period.relativeHumidity?.value}%</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
