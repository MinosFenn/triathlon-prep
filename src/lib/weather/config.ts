import type { WeatherLocation } from "@/lib/weather/types";

/** Genève — zone M-Olympia / entraînements extérieur */
const DEFAULT_LAT = 46.2044;
const DEFAULT_LON = 6.1432;
const DEFAULT_LABEL = "Genève";

function parseCoord(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getDefaultWeatherLocation(): WeatherLocation {
  return {
    lat: parseCoord(process.env.WEATHER_DEFAULT_LAT, DEFAULT_LAT),
    lon: parseCoord(process.env.WEATHER_DEFAULT_LON, DEFAULT_LON),
    label: process.env.WEATHER_DEFAULT_LABEL?.trim() || DEFAULT_LABEL,
  };
}

const DEFAULT_CACHE_SECONDS = 14_400; // 4 h

export function getWeatherCacheSeconds(): number {
  const raw = process.env.WEATHER_CACHE_SECONDS;
  if (!raw) return DEFAULT_CACHE_SECONDS;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 300 ? n : DEFAULT_CACHE_SECONDS;
}
