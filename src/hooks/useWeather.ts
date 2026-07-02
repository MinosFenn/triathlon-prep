"use client";

import { useEffect, useState } from "react";
import type { DisciplineKey } from "@/types";
import type { WeatherApiResponse } from "@/lib/weather/types";

export function useWeather(disciplineKey: DisciplineKey, dateIso?: string) {
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateIso) {
      setWeather(null);
      setError("Date de séance indisponible");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          discipline: disciplineKey,
          date: dateIso as string,
        });
        const res = await fetch(`/api/weather?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        if (!cancelled) {
          setWeather(data as WeatherApiResponse);
        }
      } catch (e) {
        if (!cancelled) {
          setWeather(null);
          setError(e instanceof Error ? e.message : "Météo indisponible");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [disciplineKey, dateIso]);

  return { weather, loading, error };
}
