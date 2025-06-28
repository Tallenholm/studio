
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, CloudSun, Loader2, AlertTriangle, Thermometer, CloudDrizzle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

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
    };
    windSpeed: string;
    windDirection: string;
    shortForecast: string;
    detailedForecast: string;
}

const getWeatherIcon = (shortForecast: string) => {
    const forecast = shortForecast.toLowerCase();
    if (forecast.includes('snow')) return <Snowflake className="h-10 w-10 text-blue-300" />;
    if (forecast.includes('rain') || forecast.includes('showers')) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (forecast.includes('thunderstorm')) return <CloudLightning className="h-10 w-10 text-yellow-500" />;
    if (forecast.includes('sunny') || forecast.includes('clear')) return <Sun className="h-10 w-10 text-yellow-400" />;
    if (forecast.includes('partly cloudy')) return <CloudSun className="h-10 w-10 text-gray-400" />;
    if (forecast.includes('cloudy')) return <Cloud className="h-10 w-10 text-gray-500" />;
    return <Thermometer className="h-10 w-10 text-gray-400" />;
};

// Kankakee / Bradley / Bourbonnais, IL Area
const LATITUDE = 41.1200;
const LONGITUDE = -87.8612;

export default function WeatherForecast({ tourId }: { tourId?: string }) {
    const [forecast, setForecast] = useState<ForecastPeriod[] | null>(null);
    const [locationName, setLocationName] = useState('your location');
    const [hourlyUrl, setHourlyUrl] = useState('');
    const [weeklyUrl, setWeeklyUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                // Step 1: Get the forecast grid URL from weather.gov
                const pointsResponse = await fetch(`https://api.weather.gov/points/${LATITUDE},${LONGITUDE}`);
                if (!pointsResponse.ok) {
                    throw new Error(`Failed to fetch weather points (status: ${pointsResponse.status}). API may be down or location invalid.`);
                }
                const pointsData = await pointsResponse.json();
                const forecastUrl = pointsData.properties.forecast;
                const hourlyForecastUrl = pointsData.properties.forecastHourly;
                const locationCity = pointsData.properties.relativeLocation.properties.city;
                const locationState = pointsData.properties.relativeLocation.properties.state;
                setLocationName(`${locationCity}, ${locationState}`);
                setWeeklyUrl(forecastUrl);
                setHourlyUrl(hourlyForecastUrl);

                // Step 2: Get the actual forecast
                const forecastResponse = await fetch(forecastUrl);
                 if (!forecastResponse.ok) {
                    throw new Error(`Failed to fetch forecast data (status: ${forecastResponse.status})`);
                }
                const forecastData = await forecastResponse.json();
                setForecast(forecastData.properties.periods);
            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const todayForecast = forecast ? forecast.slice(0, 2) : []; // Get today's daytime and nighttime forecast

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
        
        if (!todayForecast || todayForecast.length === 0) {
            return <p className="text-muted-foreground text-center h-24">No forecast data available.</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {todayForecast.map(period => (
                    <div key={period.name} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0">
                           {getWeatherIcon(period.shortForecast)}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{period.name}</p>
                            <p className="text-2xl font-bold text-primary">{period.temperature}°{period.temperatureUnit}</p>
                            <p className="text-sm text-muted-foreground">{period.shortForecast}</p>
                            {period.probabilityOfPrecipitation.value !== null && period.probabilityOfPrecipitation.value > 0 && (
                                <div className="flex items-center gap-1.5 text-sm text-blue-400 mt-1 font-medium">
                                    <CloudDrizzle className="h-4 w-4" />
                                    <span>{period.probabilityOfPrecipitation.value}% chance precipitation</span>
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
                <CardTitle>Daily Forecast for {locationName}</CardTitle>
                <CardDescription>Weather overview for {format(new Date(), 'eeee, MMMM do')}. Click below for more detailed forecasts.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
             {(!loading && !error && (hourlyUrl || weeklyUrl)) && (
                <CardFooter className="flex justify-end gap-2">
                    {hourlyUrl && <Button asChild variant="outline" size="sm"><a href={hourlyUrl} target="_blank" rel="noopener noreferrer">Hourly Forecast</a></Button>}
                    {weeklyUrl && <Button asChild variant="outline" size="sm"><a href={weeklyUrl} target="_blank" rel="noopener noreferrer">Full Forecast</a></Button>}
                </CardFooter>
            )}
        </Card>
    );
}
