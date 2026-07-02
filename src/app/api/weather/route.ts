import { NextRequest, NextResponse } from "next/server";
import type { DisciplineKey } from "@/types";
import {
  cacheKey,
  getCachedWeather,
  setCachedWeather,
} from "@/lib/weather/cache";
import { getDefaultWeatherLocation, getWeatherCacheSeconds } from "@/lib/weather/config";
import { getTodayIsoInGeneva, parseIsoDate } from "@/lib/weather/date-utils";
import { fetchWeatherFromOpenMeteo } from "@/lib/weather/open-meteo";
import type { WeatherApiResponse } from "@/lib/weather/types";

const VALID_DISCIPLINES = new Set<DisciplineKey>([
  "swim",
  "bike",
  "run",
  "brick",
  "recovery",
]);

function parseDiscipline(raw: string | null): DisciplineKey {
  if (raw && VALID_DISCIPLINES.has(raw as DisciplineKey)) {
    return raw as DisciplineKey;
  }
  return "recovery";
}

function parseCoord(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const defaults = getDefaultWeatherLocation();
    const { searchParams } = request.nextUrl;

    const lat = parseCoord(searchParams.get("lat"), defaults.lat);
    const lon = parseCoord(searchParams.get("lon"), defaults.lon);
    const label = searchParams.get("label")?.trim() || defaults.label;
    const discipline = parseDiscipline(searchParams.get("discipline"));
    const targetDate =
      parseIsoDate(searchParams.get("date")) ?? getTodayIsoInGeneva();

    const key = cacheKey(lat, lon, discipline, targetDate);
    const cached = getCachedWeather(key);

    const cacheSeconds = getWeatherCacheSeconds();
    const staleSeconds = Math.min(600, Math.round(cacheSeconds / 6));

    if (cached) {
      const body: WeatherApiResponse = {
        ...cached,
        provider: "open-meteo",
        cached: true,
      };
      return NextResponse.json(body, {
        headers: {
          "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`,
        },
      });
    }

    const snapshot = await fetchWeatherFromOpenMeteo({
      lat,
      lon,
      label,
      discipline,
      targetDate,
    });

    setCachedWeather(key, snapshot);

    const body: WeatherApiResponse = {
      ...snapshot,
      provider: "open-meteo",
      cached: false,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur météo inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
