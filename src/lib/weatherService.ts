
'use server';

import type { SystemSettings } from './settingsService';
import { addNotification, getNotifications } from './firestoreService';
import { parseISO, isWithinInterval, addHours, format } from 'date-fns';
import type { NotificationMessage } from './types';
import type { WeatherData } from './weather-utils';
import { weatherDescriptions } from './weather-utils';

const SIGNIFICANT_WEATHER_CODES = [61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99];

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    const hourlyParams = "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m";
    const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max";

    const apiKey = process.env.NEXT_PUBLIC_ECMWF_API_KEY;

    let url: string;
    let options: RequestInit = { next: { revalidate: 3600 } };
    let isPremium = false;

    if (apiKey) {
        // Use the premium ECMWF API
        isPremium = true;
        url = `https://api.ecmwf.int/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=best_match`;
        options.headers = {
            'Authorization': `ApiKey ${apiKey}`
        };
        console.log("Using premium ECMWF Weather API.");
    } else {
        // Fallback to the free Open-Meteo API
        url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=best_match`;
        console.log("Using free Open-Meteo API for weather data.");
    }
    
    const response = await fetch(url, options);

    if (!response.ok) {
        let errorBody = '';
        let errorJson: { reason?: string } | null = null;
        
        try {
            const text = await response.text();
            errorBody = text;
            try {
                // Try parsing as JSON for structured errors
                errorJson = JSON.parse(text);
            } catch {
                // It's not JSON, so we'll just use the text body
            }
        } catch {
            // Could not read body
        }

        const errorMessage = errorJson?.reason || errorBody || 'An unknown API error occurred.';

        // If the premium API fails due to an invalid key, fall back to the free one.
        if (isPremium && response.status === 400 && errorMessage.toLowerCase().includes("invalid api key")) {
            console.warn("ECMWF API key is invalid. Falling back to free weather service.");
            // Retry with the free API
            const fallbackUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=best_match`;
            const fallbackResponse = await fetch(fallbackUrl, { next: { revalidate: 3600 } });

            if (!fallbackResponse.ok) {
                // If even the fallback fails, throw an error.
                throw new Error(`Failed to fetch weather data from fallback service (status: ${fallbackResponse.status}).`);
            }
            return await fallbackResponse.json();
        }

        // For all other errors, throw an exception.
        throw new Error(`Failed to fetch weather data (status: ${response.status}). ${errorMessage}`);
    }
    
    return await response.json();
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
