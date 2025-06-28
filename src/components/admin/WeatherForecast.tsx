
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, CloudSun, Loader2, AlertTriangle, Thermometer, CloudDrizzle, Droplets, Flame } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ForecastPeriod {
    name: string;
    startTime: string;
    endTime: string;
    isDaytime: boolean;
    temperature: number;
    temperatureUnit: string;
    probabilityOfPrecipitation: {
        unitCode: string;
        value: number | null;
    } | null;
    relativeHumidity: {
        unitCode: string;
        value: number | null;
    } | null;
    heatIndex?: {
        unitCode: string;
        value: number | null;
    };
    windSpeed: string;
    windDirection: string;
    shortForecast: string;
    detailedForecast: string;
}

const getWeatherIcon = (shortForecast: string) => {
    const forecast = shortForecast.toLowerCase();
    if (forecast.includes('snow')) return <Snowflake className="h-8 w-8 text-blue-300" />;
    if (forecast.includes('rain') || forecast.includes('showers')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (forecast.includes('thunderstorm')) return <CloudLightning className="h-8 w-8 text-yellow-500" />;
    if (forecast.includes('sunny') || forecast.includes('clear')) return <Sun className="h-8 w-8 text-yellow-400" />;
    if (forecast.includes('partly cloudy') || forecast.includes('mostly cloudy')) return <CloudSun className="h-8 w-8 text-gray-400" />;
    if (forecast.includes('cloudy')) return <Cloud className="h-8 w-8 text-gray-500" />;
    return <Thermometer className="h-8 w-8 text-gray-400" />;
};

// Kankakee / Bradley / Bourbonnais, IL Area
const LATITUDE = 41.1200;
const LONGITUDE = -87.8612;

export default function WeatherForecast({ tourId }: { tourId?: string }) {
    const [forecast, setForecast] = useState<ForecastPeriod[] | null>(null);
    const [locationName, setLocationName] = useState('your location');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Step 1: Get the forecast grid URL from weather.gov
                const pointsResponse = await fetch(`https://api.weather.gov/points/${LATITUDE},${LONGITUDE}`);
                if (!pointsResponse.ok) {
                    throw new Error(`Failed to fetch weather points (status: ${pointsResponse.status}). API may be down or location invalid.`);
                }
                const pointsData = await pointsResponse.json();
                const hourlyForecastUrl = pointsData.properties.forecastHourly;
                const locationCity = pointsData.properties.relativeLocation.properties.city;
                const locationState = pointsData.properties.relativeLocation.properties.state;
                setLocationName(`${locationCity}, ${locationState}`);

                // Step 2: Get the HOURLY forecast for more detailed data
                const forecastResponse = await fetch(hourlyForecastUrl);
                 if (!forecastResponse.ok) {
                    throw new Error(`Failed to fetch forecast data (status: ${forecastResponse.status})`);
                }
                const forecastData = await forecastResponse.json();
                setForecast(forecastData.properties.periods);
                setError(null); // Clear previous errors on success
            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false); // This will only affect the initial load's spinner
            }
        };
        
        fetchWeather(); // Initial fetch
        
        // Refresh weather data every 30 minutes
        const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array ensures this setup runs only once on mount

    const upcomingForecast = useMemo(() => {
        if (!forecast) return [];
        const now = new Date();
        // Find the index of the first forecast period that hasn't ended yet
        const currentIndex = forecast.findIndex(period => isAfter(parseISO(period.endTime), now));
        // If all forecast data is in the past, return an empty array (the next fetch will get new data)
        if (currentIndex === -1) return [];
        // Return the current and next 3 forecast periods
        return forecast.slice(currentIndex, currentIndex + 4);
    }, [forecast]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center gap-3 text-muted-foreground h-24">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Fetching weather forecast...</span>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="flex items-center justify-center gap-3 text-destructive h-24">
                    <AlertTriangle className="h-6 w-6" />
                    <span>{error}</span>
                </div>
            );
        }
        
        if (!upcomingForecast || upcomingForecast.length === 0) {
            return <p className="text-muted-foreground text-center h-24 flex items-center justify-center">No forecast data available for the upcoming hours.</p>;
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {upcomingForecast.map(period => (
                    <div key={period.startTime} className="flex flex-col items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg text-center">
                        <p className="font-bold text-lg">{format(parseISO(period.startTime), 'ha')}</p>
                        <div className="my-2">
                           {getWeatherIcon(period.shortForecast)}
                        </div>
                        <p className="text-2xl font-bold text-primary">{period.temperature}°</p>
                        <p className="text-xs text-muted-foreground h-8">{period.shortForecast}</p>
                        <div className="flex flex-col items-center gap-1 text-xs mt-2 w-full pt-2 border-t">
                            {period.relativeHumidity && period.relativeHumidity.value !== null && (
                                <div className="flex items-center gap-1.5" title="Humidity">
                                    <Droplets className="h-3 w-3 text-blue-400" />
                                    <span className="text-muted-foreground">{period.relativeHumidity.value}% RH</span>
                                </div>
                            )}
                            {period.heatIndex && period.heatIndex.value !== null && period.heatIndex.value > period.temperature && (
                                <div className="flex items-center gap-1.5" title="Heat Index">
                                    <Flame className="h-3 w-3 text-red-500" />
                                    <span className="text-muted-foreground">Feels {period.heatIndex.value}°</span>
                                </div>
                            )}
                            {period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null && period.probabilityOfPrecipitation.value > 10 && (
                                <div className="flex items-center gap-1.5" title="Precipitation">
                                    <CloudDrizzle className="h-3 w-3 text-blue-500" />
                                    <span className="text-muted-foreground">{period.probabilityOfPrecipitation.value}% Rain</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Card id={tourId} className="mb-8">
            <CardHeader>
                <CardTitle>Upcoming Hourly Forecast for {locationName}</CardTitle>
                <CardDescription>Weather for {format(new Date(), 'eeee, MMMM do')}. Click below for the detailed forecast.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
             {(!loading && !error) && (
                <CardFooter className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/weather">View Full Forecast</Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
