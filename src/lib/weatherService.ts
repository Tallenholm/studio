
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
    const hourlyParams = "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m";
    const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,uv_index_max";

    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=best_match`;
    let isPremium = false;

    if (apiKey) {
        url = `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=ecmwf_ifs&apikey=${apiKey}`;
        isPremium = true;
        console.log("Attempting to use premium ECMWF API for weather data.");
    } else {
        console.log("Using free Open-Meteo API for weather data.");
    }
    
    let response = await fetch(url, { next: { revalidate: 3600 } });

    // Handle initial response
    if (!response.ok) {
        // If the premium API fails due to an invalid key, fall back to the free one.
        if (isPremium && response.status === 400) {
            const errorJson = await response.json().catch(() => null);
            if (errorJson && /invalid api key/i.test(errorJson.reason)) {
                console.warn("****************************************************************");
                console.warn("WARNING: Invalid ECMWF API key. Falling back to free weather API.");
                console.warn("Please check your NEXT_PUBLIC_ECMWF_API_KEY environment variable.");
                console.warn("****************************************************************");
                
                // Construct the URL for the free API
                const fallbackUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyParams}&daily=${dailyParams}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&models=best_match`;
                
                // Retry the fetch with the free URL
                response = await fetch(fallbackUrl, { next: { revalidate: 3600 } });

                // If the fallback also fails, then throw a generic error
                if (!response.ok) {
                     throw new Error(`Failed to fetch weather data from fallback API (status: ${response.status}).`);
                }

            } else {
                 // The error was something other than an invalid key, so we throw it.
                 throw new Error(`Failed to fetch weather data (status: ${response.status}). ${errorJson?.reason || 'An unknown API error occurred.'}`);
            }
        } else {
             // Handle non-400 errors or failures on the free API
            const errorBody = await response.text();
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
