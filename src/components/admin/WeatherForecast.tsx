
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, CloudSun, Loader2, AlertTriangle, Thermometer, CloudDrizzle, Droplets, Flame, Wind } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { loadSystemSettings } from '@/lib/settingsService';

interface HourlyData {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
}

interface WeatherData {
    latitude: number;
    longitude: number;
    hourly: HourlyData;
}

interface ForecastPeriod {
    time: string;
    temperature: number;
    humidity: number | null;
    precipitation: number | null;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
}

const getWeatherIcon = (code: number, isDay: boolean = true) => {
    switch (code) {
        case 0: return <Sun className="h-8 w-8 text-yellow-400" />; // Clear sky
        case 1: return <CloudSun className="h-8 w-8 text-gray-400" />; // Mainly clear
        case 2: return <CloudSun className="h-8 w-8 text-gray-400" />; // Partly cloudy
        case 3: return <Cloud className="h-8 w-8 text-gray-500" />; // Overcast
        case 45: case 48: return <Cloud className="h-8 w-8 text-gray-500" />; // Fog
        case 51: case 53: case 55: return <CloudDrizzle className="h-8 w-8 text-blue-400" />; // Drizzle
        case 61: case 63: case 65: return <CloudRain className="h-8 w-8 text-blue-500" />; // Rain
        case 66: case 67: return <CloudRain className="h-8 w-8 text-blue-500" />; // Freezing Rain
        case 71: case 73: case 75: return <Snowflake className="h-8 w-8 text-blue-300" />; // Snow fall
        case 77: return <Snowflake className="h-8 w-8 text-blue-300" />; // Snow grains
        case 80: case 81: case 82: return <CloudRain className="h-8 w-8 text-blue-500" />; // Rain showers
        case 85: case 86: return <Snowflake className="h-8 w-8 text-blue-300" />; // Snow showers
        case 95: return <CloudLightning className="h-8 w-8 text-yellow-500" />; // Thunderstorm
        case 96: case 99: return <CloudLightning className="h-8 w-8 text-yellow-500" />; // Thunderstorm with hail
        default: return <Thermometer className="h-8 w-8 text-gray-400" />;
    }
};

const weatherDescriptions: { [key: number]: string } = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, slight hail', 99: 'Thunderstorm, heavy hail',
};


export default function WeatherForecast({ tourId }: { tourId?: string }) {
    const [forecast, setForecast] = useState<ForecastPeriod[] | null>(null);
    const [locationName, setLocationName] = useState('your location');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            const apiKey = process.env.NEXT_PUBLIC_ECMWF_API_KEY;
            if (!apiKey) {
                setError("Weather API key is not configured.");
                setLoading(false);
                return;
            }

            try {
                const settings = loadSystemSettings();
                const lat = settings.locationLat;
                const lon = settings.locationLon;
                
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch weather data (status: ${response.status})`);
                }
                const data: WeatherData = await response.json();

                const processedForecast: ForecastPeriod[] = data.hourly.time.map((t, i) => ({
                    time: t,
                    temperature: data.hourly.temperature_2m[i],
                    humidity: data.hourly.relative_humidity_2m[i],
                    precipitation: data.hourly.precipitation_probability[i],
                    weatherCode: data.hourly.weather_code[i],
                    windSpeed: data.hourly.wind_speed_10m[i],
                    windDirection: data.hourly.wind_direction_10m[i],
                }));
                
                setForecast(processedForecast);
                setLocationName(`Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`);
                setError(null);
            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchWeather();
        const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    const upcomingForecast = useMemo(() => {
        if (!forecast) return [];
        const now = new Date();
        const currentIndex = forecast.findIndex(period => isAfter(parseISO(period.time), now));
        if (currentIndex === -1) return [];
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
            return <p className="text-muted-foreground text-center h-24 flex items-center justify-center">No forecast data available.</p>;
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {upcomingForecast.map(period => (
                    <div key={period.time} className="flex flex-col items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg text-center">
                        <p className="font-bold text-lg">{format(parseISO(period.time), 'ha')}</p>
                        <div className="my-2">
                           {getWeatherIcon(period.weatherCode)}
                        </div>
                        <p className="text-2xl font-bold text-primary">{Math.round(period.temperature)}°</p>
                        <p className="text-xs text-muted-foreground h-8">{weatherDescriptions[period.weatherCode] || 'N/A'}</p>
                        <div className="flex flex-col items-center gap-1 text-xs mt-2 w-full pt-2 border-t">
                            {period.humidity !== null && (
                                <div className="flex items-center gap-1.5" title="Humidity">
                                    <Droplets className="h-3 w-3 text-blue-400" />
                                    <span className="text-muted-foreground">{period.humidity}% RH</span>
                                </div>
                            )}
                             {period.precipitation !== null && period.precipitation > 10 && (
                                <div className="flex items-center gap-1.5" title="Precipitation">
                                    <CloudDrizzle className="h-3 w-3 text-blue-500" />
                                    <span className="text-muted-foreground">{period.precipitation}% Rain</span>
                                </div>
                            )}
                             <div className="flex items-center gap-1.5" title="Wind">
                                <Wind className="h-3 w-3" />
                                <span className="text-muted-foreground">{Math.round(period.windSpeed)} mph</span>
                            </div>
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
                <CardDescription>Weather for {format(new Date(), 'eeee, MMMM do')}.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
