import type { DisciplineKey } from "@/types";

export type WeatherAlertLevel = "ok" | "caution" | "warning";

export interface WeatherLocation {
  label: string;
  lat: number;
  lon: number;
}

export interface WeatherCurrent {
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  windGustsKmh: number;
  precipitationMm: number;
  weatherCode: number;
  label: string;
}

export interface WeatherRecommendation {
  level: WeatherAlertLevel;
  headline: string;
  tips: string[];
}

export interface WeatherSnapshot {
  location: WeatherLocation;
  /** YYYY-MM-DD — jour de la séance */
  targetDate: string;
  /** current = aujourd'hui temps réel, forecast = prévision journalière */
  source: "current" | "forecast";
  current: WeatherCurrent;
  recommendation: WeatherRecommendation;
  fetchedAt: string;
}

export interface WeatherApiResponse extends WeatherSnapshot {
  provider: "open-meteo";
  cached: boolean;
}

export interface FetchWeatherParams {
  lat: number;
  lon: number;
  label: string;
  discipline: DisciplineKey;
  targetDate: string;
}
