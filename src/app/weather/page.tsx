'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, Snowflake, CloudRain, CloudLightning, Thermometer, CloudDrizzle, Droplets, Wind, Sunrise, Sunset, Loader2, AlertTriangle, MapPin } from 'lucide-react';
import { format, parseISO, isSameDay, startOfToday } from 'date-fns';
import { loadSystemSettings } from '@/lib/settingsService';
import { fetchWeather } from '@/lib/weatherService';
import type { WeatherData, ForecastDay, HourlyForecast } from '@/lib/weather-utils';
import { weatherDescriptions } from '@/lib/weather-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getWeatherIcon = (code: number | null, size: 'large' | 'small' = 'large') => {
    const className = size === 'large' ? "h-10 w-10" : "h-6 w-6";
    if (code === null || !weatherDescriptions[code]) return <Thermometer className={`${className} text-gray-400`} />;
    const desc = weatherDescriptions[code].toLowerCase();
    
    if (desc.includes('clear')) return <Sun className={`${className} text-yellow-400`} />;
    if (desc.includes('snow')) return <Snowflake className={`${className} text-blue-300`} />;
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return <CloudRain className={`${className} text-blue-500`} />;
    if (desc.includes('thunderstorm')) return <CloudLightning className={`${className} text-yellow-500`} />;
    if (desc.includes('cloud') || desc.includes('overcast')) return <Cloud className={`${className} text-gray-400`} />;
    if (desc.includes('fog')) return <Cloud className={`${className} text-gray-500`} />;

    return <Thermometer className={`${className} text-gray-400`} />;
};

type RadarLayer = 'radar' | 'wind' | 'snow';

export default function WeatherPage() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState({ lat: 41.12, lon: -87.86 });
    const [locationName, setLocationName] = useState('your location');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [radarLayer, setRadarLayer] = useState<RadarLayer>('radar');

    useEffect(() => {
        const settings = loadSystemSettings();
        setLocation({ lat: settings.locationLat, lon: settings.locationLon });
    }, []);

    useEffect(() => {
        const loadWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchWeather(location.lat, location.lon);
                setWeatherData(data);
                setLocationName(`Lat: ${location.lat.toFixed(2)}, Lon: ${location.lon.toFixed(2)}`);
                
                // Set default radar layer based on weather
                const todaysWeatherCode = data.daily?.weather_code?.[0] ?? 0;
                if ([71, 73, 75, 85, 86].includes(todaysWeatherCode)) {
                    setRadarLayer('snow');
                } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(todaysWeatherCode)) {
                    setRadarLayer('radar');
                } else {
                    setRadarLayer('wind');
                }

            } catch (err: any) {
                console.error("Weather fetch error:", err);
                setError(err.message || "Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };
        loadWeather();
    }, [location]);

    const { dailyForecast, hourlyForecast } = useMemo(() => {
        if (!weatherData) {
            return { dailyForecast: [], hourlyForecast: [] };
        }
        
        const today = startOfToday();

        const daily: ForecastDay[] = (weatherData.daily.time || [])
            .map((t, i) => ({
                time: t,
                weatherCode: weatherData.daily.weather_code[i] ?? 0,
                tempMax: weatherData.daily.temperature_2m_max[i] ?? 0,
                tempMin: weatherData.daily.temperature_2m_min[i] ?? 0,
                sunrise: weatherData.daily.sunrise[i],
                sunset: weatherData.daily.sunset[i],
                precipitation: weatherData.daily.precipitation_probability_max[i] ?? 0,
                precipitationSum: weatherData.daily.precipitation_sum[i] ?? 0,
                uvIndex: weatherData.daily.uv_index_max[i] ?? 0,
            }))
            .filter(day => parseISO(day.time) >= today);

        const now = new Date();
        const hourly: HourlyForecast[] = (weatherData.hourly.time || [])
            .map((t, i) => ({
                time: t,
                temp: weatherData.hourly.temperature_2m[i] ?? 0,
                precipitation: weatherData.hourly.precipitation_probability[i] ?? 0,
                weatherCode: weatherData.hourly.weather_code[i] ?? 0,
                windSpeed: weatherData.hourly.wind_speed_10m[i] ?? 0,
                humidity: weatherData.hourly.relative_humidity_2m[i] ?? 0,
                windDirection: weatherData.hourly.wind_direction_10m[i] ?? 0,
            }))
            .filter(h => parseISO(h.time) >= now)
            .slice(0, 24);

        return { dailyForecast: daily, hourlyForecast: hourly };
    }, [weatherData]);

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-headline font-bold flex items-center justify-center gap-3"><Cloud className="h-10 w-10 text-primary"/>Weather Center</h1>
                <p className="text-md md:text-lg text-muted-foreground mt-2 flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5"/>
                    Showing weather for {locationName}
                </p>
            </div>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Live Radar</CardTitle>
                    <Tabs value={radarLayer} onValueChange={(value) => setRadarLayer(value as RadarLayer)} className="w-full pt-2">
                        <TabsList>
                            <TabsTrigger value="radar">Radar</TabsTrigger>
                            <TabsTrigger value="wind">Wind</TabsTrigger>
                            <TabsTrigger value="snow">Snow</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <div className="h-96 md:h-auto md:aspect-video w-full bg-muted rounded-lg overflow-hidden border">
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

            <Card className="mb-8">
                 <CardHeader>
                    <CardTitle>Hourly Forecast (Next 24 Hours)</CardTitle>
                </CardHeader>
                <CardContent>
                   {loading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                   )}
                   {error && !loading && (
                       <div className="flex items-center justify-center h-40 text-destructive gap-4">
                            <AlertTriangle className="h-8 w-8" />
                            <span>{error}</span>
                        </div>
                   )}
                   {hourlyForecast.length > 0 && (
                       <div className="w-full overflow-x-auto">
                           <div className="flex flex-nowrap gap-4 pb-4">
                                {hourlyForecast.map(hour => (
                                    <div key={hour.time} className="flex flex-col items-center justify-between p-3 text-center bg-muted/30 rounded-lg shrink-0 w-28">
                                        <p className="font-bold">{format(parseISO(hour.time), 'ha')}</p>
                                        <div className="my-2">{getWeatherIcon(hour.weatherCode, 'small')}</div>
                                        <p className="font-bold text-lg">{Math.round(hour.temp)}°</p>
                                        <p className="text-xs text-muted-foreground capitalize h-10 flex-grow flex items-center">{weatherDescriptions[hour.weatherCode] || 'N/A'}</p>
                                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5 border-t pt-1 w-full">
                                            <p className="flex items-center justify-center gap-1"><CloudDrizzle className="h-3 w-3 text-blue-400" /> {hour.precipitation}%</p>
                                            <p className="flex items-center justify-center gap-1"><Wind className="h-3 w-3" /> {Math.round(hour.windSpeed)} mph</p>
                                            <p className="flex items-center justify-center gap-1"><Droplets className="h-3 w-3 text-blue-300" /> {Math.round(hour.humidity)}%</p>
                                        </div>
                                    </div>
                                ))}
                           </div>
                       </div>
                   )}
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                            {[...Array(7)].map((_, i) => (
                                <Card key={i} className="flex flex-col items-center justify-center p-4 text-center bg-muted/30 h-64">
                                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </Card>
                            ))}
                        </div>
                    )}
                    {error && !loading && (
                         <div className="flex items-center justify-center h-64 text-destructive gap-4">
                            <AlertTriangle className="h-12 w-12" />
                            <span>{error}</span>
                        </div>
                    )}
                    {dailyForecast.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {dailyForecast.map(day => (
                                <Card key={day.time} className="flex flex-col items-center justify-between p-3 md:p-4 text-center bg-muted/30">
                                    <p className="font-bold text-md md:text-lg">{isSameDay(parseISO(day.time), new Date()) ? 'Today' : format(parseISO(day.time), 'EEE')}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">{format(parseISO(day.time), 'MMM d')}</p>
                                    <div className="my-3">{getWeatherIcon(day.weatherCode, 'large')}</div>
                                    <p className="font-bold text-xl md:text-2xl">{Math.round(day.tempMax)}°<span className="text-muted-foreground">/{Math.round(day.tempMin)}°</span></p>
                                    <p className="text-xs md:text-sm text-muted-foreground capitalize h-10 flex items-center text-center">{weatherDescriptions[day.weatherCode] || 'N/A'}</p>
                                    <div className="text-xs text-muted-foreground mt-2 space-y-1 border-t pt-2 w-full">
                                        <p className="flex items-center justify-center gap-1.5"><CloudDrizzle className="h-4 w-4 text-blue-400" /> {day.precipitation}% ({day.precipitationSum?.toFixed(2)}"")</p>
                                        <p className="flex items-center justify-center gap-1.5"><Sun className="h-4 w-4 text-yellow-500" /> UV: {day.uvIndex?.toFixed(1) || 'N/A'}</p>
                                        <p className="flex items-center justify-center gap-1.5"><Sunrise className="h-4 w-4 text-yellow-400" /> {day.sunrise ? format(parseISO(day.sunrise), 'p') : 'N/A'}</p>
                                        <p className="flex items-center justify-center gap-1.5"><Sunset className="h-4 w-4 text-orange-400" /> {day.sunset ? format(parseISO(day.sunset), 'p') : 'N/A'}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    