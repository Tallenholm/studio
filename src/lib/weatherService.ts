
'use server';

import type { SystemSettings } from './settingsService';
import { addNotification, getNotifications } from './firestoreService';
import { parseISO, isWithinInterval, addHours, format } from 'date-fns';
import type { NotificationMessage } from './types';
import type { WeatherData } from './weather-utils';
import { weatherDescriptions } from './weather-utils';

const SIGNIFICANT_WEATHER_CODES = [61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99];

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    const apiKey = process.env.NEXT_PUBLIC_ECMWF_API_KEY;
    
    let baseUrl = 'https://api.open-meteo.com/v1/forecast';
    let model = 'ecmwf_ifs04'; // Use high-res model

    if (apiKey) {
        baseUrl = 'https://api.ecmwf.int/v1/forecast'; // Official ECMWF endpoint
        model = 'ecmwf_ifs';
        console.log("Using ECMWF API Key.");
    } else {
        console.warn("ECMWF API key is not configured in .env.local, using free tier Open-Meteo API. Some features may be limited.");
    }

    const hourlyParams = "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m";
    const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max";
    
    const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=${model}${apiKey ? `&apikey=${apiKey}` : ''}`;
    
    const response = await fetch(url, { cache: 'no-store' }); // Disable caching for fresh data

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Weather API Error Body:", errorBody);
        throw new Error(`Failed to fetch weather data (status: ${response.status}). ${errorBody.reason || ''}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Weather API Error: ${data.reason}`);
    }

    return data;
};

export const checkWeatherAndNotify = async (settings: Pick<SystemSettings, 'locationLat' | 'locationLon'>) => {
    try {
        const [existingNotifications, weatherData] = await Promise.all([
            getNotifications(),
            fetchWeather(settings.locationLat, settings.locationLon)
        ]);

        const now = new Date();
        const next24Hours = addHours(now, 24);

        const upcomingHourly = weatherData.hourly.time
            .map((t, i) => ({
                time: parseISO(t),
                code: weatherData.hourly.weather_code[i],
            }))
            .filter(h => isWithinInterval(h.time, { start: now, end: next24Hours }));

        for (const hour of upcomingHourly) {
            if (hour.code !== null && SIGNIFICANT_WEATHER_CODES.includes(hour.code)) {
                const weatherType = weatherDescriptions[hour.code];
                const notifDate = format(hour.time, 'yyyy-MM-dd-HH');
                const notifId = `weather-alert-${weatherType.replace(/\s+/g, '-')}-${notifDate}`;

                // Check if a similar notification already exists
                const alreadyNotified = existingNotifications.some(n => n.id === notifId);

                if (!alreadyNotified) {
                    const newNotif: Omit<NotificationMessage, 'id'> = {
                        id: notifId,
                        recipientId: 'all',
                        title: `Weather Alert: ${weatherType}`,
                        content: `Heads up: The forecast shows ${weatherType.toLowerCase()} starting around ${format(hour.time, 'p')} today. Please prepare accordingly.`,
                        senderName: 'System Weather Service',
                        timestamp: new Date().toISOString(),
                        readBy: [],
                    };
                    await addNotification(newNotif, notifId);
                    console.log(`Sent notification for ${weatherType} at ${hour.time}`);
                    // Once we notify for a weather type, we can stop checking for it to avoid spam
                    // This simple implementation notifies for the first significant event found.
                    // A more complex system could group events.
                    return; 
                }
            }
        }
    } catch (error) {
        console.error("Failed to check weather and send notifications:", error);
    }
};
