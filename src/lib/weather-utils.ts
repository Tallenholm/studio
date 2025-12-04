
// Interfaces for ECMWF API data structure
interface DailyData {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
}

interface HourlyData {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
}

export interface WeatherData {
    latitude: number;
    longitude: number;
    daily: DailyData;
    hourly: HourlyData;
}

export interface ForecastDay {
    time: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    sunrise: string;
    sunset: string;
    precipitation: number | null;
}

export interface HourlyForecast {
    time: string;
    temp: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
}

export const weatherDescriptions: { [key: number]: string } = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Showers', 82: 'Violent showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, heavy hail',
};
