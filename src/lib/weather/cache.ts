import type { WeatherSnapshot } from "@/lib/weather/types";
import { getWeatherCacheSeconds } from "@/lib/weather/config";

const memoryCache = new Map<
  string,
  { expiresAt: number; data: WeatherSnapshot }
>();

export function cacheKey(
  lat: number,
  lon: number,
  discipline: string,
  targetDate: string
): string {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}:${discipline}:${targetDate}`;
}

export function getCachedWeather(key: string): WeatherSnapshot | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedWeather(key: string, data: WeatherSnapshot): void {
  const ttlMs = getWeatherCacheSeconds() * 1000;
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
