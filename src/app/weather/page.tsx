
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, Thermometer, CloudDrizzle, Droplets, Wind, Sunrise, Sunset, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { loadSystemSettings } from '@/lib/settingsService';

interface DailyData {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
}

interface WeatherData {
    latitude: number;
    longitude: number;
    daily: DailyData;
}

interface ForecastDay {
    time: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    sunrise: string;
    sunset: string;
    precipitation: number | null;
}

const getWeatherIcon = (code: number) => {
    switch (code) {
        case 0: return <Sun className="h-10 w-10 text-yellow-400" />;
        case 1: case 2: return <Cloud className="h-10 w-10 text-gray-400" />;
        case 3: return <Cloud className="h-10 w-10 text-gray-500" />;
        case 45: case 48: return <Cloud className="h-10 w-10 text-gray-500" />;
        case 51: case 53: case 55: return <CloudDrizzle className="h-10 w-10 text-blue-400" />;
        case 61: case 63: case 65: return <CloudRain className="h-10 w-10 text-blue-500" />;
        case 71: case 73: case 75: return <Snowflake className="h-10 w-10 text-blue-300" />;
        case 80: case 81: case 82: return <CloudRain className="h-10 w-10 text-blue-500" />;
        case 85: case 86: return <Snowflake className="h-10 w-10 text-blue-300" />;
        case 95: case 96: case 99: return <CloudLightning className="h-10 w-10 text-yellow-500" />;
        default: return <Thermometer className="h-10 w-10 text-gray-400" />;
    }
};

const weatherDescriptions: { [key: number]: string } = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Showers', 82: 'Violent showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, heavy hail',
};


export default function WeatherPage() {
    const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
    const [location, setLocation] = useState({ lat: 41.12, lon: -87.86 });
    const [locationName, setLocationName] = useState('your location');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const settings = loadSystemSettings();
        setLocation({ lat: settings.locationLat, lon: settings.locationLon });
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch weather data (status: ${response.status})`);
                
                const data: WeatherData = await response.json();
                
                const processedForecast = data.daily.time.map((t, i) => ({
                    time: t,
                    weatherCode: data.daily.weather_code[i],
                    tempMax: data.daily.temperature_2m_max[i],
                    tempMin: data.daily.temperature_2m_min[i],
                    sunrise: data.daily.sunrise[i],
                    sunset: data.daily.sunset[i],
                    precipitation: data.daily.precipitation_probability_max[i],
                }));
                
                setForecast(processedForecast);
                setLocationName(`Lat: ${location.lat.toFixed(2)}, Lon: ${location.lon.toFixed(2)}`);
                setError(null);
            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location]);

    const radarLayer = useMemo(() => {
        if (!forecast || forecast.length === 0) {
            return 'snow'; // Default if no data
        }
        const todaysWeatherCode = forecast[0].weatherCode;
        // Prioritize snow layers
        if ([71, 73, 75, 85, 86].includes(todaysWeatherCode)) {
            return 'snow';
        }
        // Then rain/storm layers
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(todaysWeatherCode)) {
            return 'radar';
        }
        // Default to wind if nothing else
        return 'wind';
    }, [forecast]);


    const renderForecast = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center col-span-full h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex items-center justify-center col-span-full h-64 text-destructive gap-4">
                    <AlertTriangle className="h-12 w-12" />
                    <span>{error}</span>
                </div>
            );
        }
        if (!forecast) return null;

        return forecast.map(day => (
            <Card key={day.time} className="flex flex-col items-center justify-between p-4 text-center bg-muted/30">
                <p className="font-bold text-lg">{isSameDay(parseISO(day.time), new Date()) ? 'Today' : format(parseISO(day.time), 'EEE')}</p>
                <p className="text-sm text-muted-foreground">{format(parseISO(day.time), 'MMM d')}</p>
                <div className="my-3">{getWeatherIcon(day.weatherCode)}</div>
                <p className="font-bold text-2xl">{Math.round(day.tempMax)}°<span className="text-muted-foreground">/{Math.round(day.tempMin)}°</span></p>
                <p className="text-sm text-muted-foreground capitalize h-10 flex items-center">{weatherDescriptions[day.weatherCode]}</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1 border-t pt-2 w-full">
                    {day.precipitation !== null && (
                        <p className="flex items-center justify-center gap-1.5"><CloudDrizzle className="h-4 w-4 text-blue-400" /> {day.precipitation}%</p>
                    )}
                    <p className="flex items-center justify-center gap-1.5"><Sunrise className="h-4 w-4 text-yellow-400" /> {format(parseISO(day.sunrise), 'p')}</p>
                    <p className="flex items-center justify-center gap-1.5"><Sunset className="h-4 w-4 text-orange-400" /> {format(parseISO(day.sunset), 'p')}</p>
                </div>
            </Card>
        ));
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-headline font-bold flex items-center justify-center gap-3"><Cloud className="h-10 w-10 text-primary"/>Weather Center</h1>
                <p className="text-lg text-muted-foreground mt-2 flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5"/>
                    Showing weather for {locationName}
                </p>
            </div>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Live Radar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden border">
                         <iframe
                            width="100%"
                            height="100%"
                            src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricWind=mph&metricTemp=°F&radarRange=-1&lat=${location.lat}&lon=${location.lon}&zoom=7&layer=${radarLayer}`}
                            frameBorder="0"
                            title="Live Weather Radar by Windy.com"
                        ></iframe>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {renderForecast()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
