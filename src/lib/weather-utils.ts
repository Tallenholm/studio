
// Interfaces for ECMWF API data structure
interface DailyData {
    time: string[];
    weather_code: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
    uv_index_max: (number | null)[];
}

interface HourlyData {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
    precipitation_probability: (number | null)[];
    weather_code: (number | null)[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
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
    precipitationSum: number | null;
    uvIndex: number | null;
}

export interface HourlyForecast {
    time: string;
    temp: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    windDirection: number;
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
