import { weatherCodeLabel } from "@/lib/weather/codes";
import { getWeatherCacheSeconds } from "@/lib/weather/config";
import {
  daysFromToday,
  getTodayIsoInGeneva,
} from "@/lib/weather/date-utils";
import { buildWeatherRecommendation } from "@/lib/weather/recommendations";
import type {
  FetchWeatherParams,
  WeatherCurrent,
  WeatherSnapshot,
} from "@/lib/weather/types";

interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
}

interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  relative_humidity_2m_mean: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "relative_humidity_2m_mean",
].join(",");

export async function fetchWeatherFromOpenMeteo(
  params: FetchWeatherParams
): Promise<WeatherSnapshot> {
  const targetDate = params.targetDate ?? getTodayIsoInGeneva();
  const isToday = targetDate === getTodayIsoInGeneva();
  const offset = daysFromToday(targetDate);

  if (offset > 16) {
    throw new Error(
      "Prévision disponible jusqu'à 16 jours — revenir plus près de cette date"
    );
  }

  if (isToday) {
    const current = await fetchCurrentConditions(params);
    return buildSnapshot(params, targetDate, current, "current");
  }

  const daily = await fetchDailyForDate(params, targetDate);
  return buildSnapshot(params, targetDate, daily, "forecast");
}

async function fetchCurrentConditions(
  params: FetchWeatherParams
): Promise<WeatherCurrent> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(params.lat));
  url.searchParams.set("longitude", String(params.lon));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(",")
  );
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "Europe/Zurich");

  const data = await fetchOpenMeteo(url);
  const c = data.current;
  if (!c) throw new Error("Open-Meteo: pas de données actuelles");

  return mapCurrent(c);
}

async function fetchDailyForDate(
  params: FetchWeatherParams,
  targetDate: string
): Promise<WeatherCurrent> {
  const offset = daysFromToday(targetDate);
  const pastDays = offset < 0 ? Math.min(92, Math.abs(offset) + 1) : 0;
  const forecastDays = offset >= 0 ? Math.min(16, offset + 1) : 1;

  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(params.lat));
  url.searchParams.set("longitude", String(params.lon));
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "Europe/Zurich");
  url.searchParams.set("past_days", String(pastDays));
  url.searchParams.set("forecast_days", String(forecastDays));

  const data = await fetchOpenMeteo(url);
  const daily = data.daily;
  if (!daily?.time?.length) {
    throw new Error("Open-Meteo: pas de prévision journalière");
  }

  const index = daily.time.indexOf(targetDate);
  if (index < 0) {
    throw new Error(`Pas de données météo pour le ${targetDate}`);
  }

  const tempMax = daily.temperature_2m_max[index];
  const tempMin = daily.temperature_2m_min[index];
  const feelMax = daily.apparent_temperature_max[index];
  const feelMin = daily.apparent_temperature_min[index];

  return {
    tempC: Math.round((tempMax + tempMin) / 2),
    feelsLikeC: Math.round((feelMax + feelMin) / 2),
    humidityPct: Math.round(daily.relative_humidity_2m_mean[index]),
    windKmh: Math.round(daily.wind_speed_10m_max[index]),
    windGustsKmh: Math.round(daily.wind_gusts_10m_max[index]),
    precipitationMm: Math.round(daily.precipitation_sum[index] * 10) / 10,
    weatherCode: daily.weather_code[index],
    label: weatherCodeLabel(daily.weather_code[index]),
  };
}

function mapCurrent(c: OpenMeteoCurrent): WeatherCurrent {
  return {
    tempC: Math.round(c.temperature_2m),
    feelsLikeC: Math.round(c.apparent_temperature),
    humidityPct: Math.round(c.relative_humidity_2m),
    windKmh: Math.round(c.wind_speed_10m),
    windGustsKmh: Math.round(c.wind_gusts_10m),
    precipitationMm: Math.round(c.precipitation * 10) / 10,
    weatherCode: c.weather_code,
    label: weatherCodeLabel(c.weather_code),
  };
}

async function fetchOpenMeteo(url: URL): Promise<OpenMeteoResponse> {
  const res = await fetch(url.toString(), {
    next: { revalidate: getWeatherCacheSeconds() },
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

function buildSnapshot(
  params: FetchWeatherParams,
  targetDate: string,
  current: WeatherCurrent,
  source: "current" | "forecast"
): WeatherSnapshot {
  return {
    location: {
      label: params.label,
      lat: params.lat,
      lon: params.lon,
    },
    targetDate,
    source,
    current,
    recommendation: buildWeatherRecommendation(params.discipline, current),
    fetchedAt: new Date().toISOString(),
  };
}
