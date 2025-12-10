
'use server';

import type { SystemSettings } from './settingsService';
import { addNotification, getNotifications } from './firestoreService';
import { parseISO, isWithinInterval, addHours, format } from 'date-fns';
import type { NotificationMessage } from './types';
import type { WeatherData } from './weather-utils';
import { weatherDescriptions } from './weather-utils';

const SIGNIFICANT_WEATHER_CODES = [61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99];

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    // Always use the free Open-Meteo API to ensure functionality without a premium key.
    const baseUrl = 'https://api.open-meteo.com/v1/forecast';
    const model = 'best_match'; 
    
    console.log("Using Open-Meteo API for weather data.");

    const hourlyParams = "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m";
    const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max";
    
    let url = `${baseUrl}?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=${model}`;
    
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorBody: any;
        if (contentType && contentType.includes('application/json')) {
            errorBody = await response.json();
            console.error("Weather API JSON Error Body:", errorBody);
            throw new Error(`Failed to fetch weather data (status: ${response.status}). ${errorBody.reason || 'An unknown API error occurred.'}`);
        } else {
            errorBody = await response.text();
            console.error("Weather API Text Error Body:", errorBody);
            throw new Error(`Failed to fetch weather data (status: ${response.status}). ${errorBody}`);
        }
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
                    return; 
                }
            }
        }
    } catch (error) {
        console.error("Failed to check weather and send notifications:", error);
    }
};
