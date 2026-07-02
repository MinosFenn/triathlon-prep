"use client";

import type { DisciplineKey } from "@/types";
import { useWeather } from "@/hooks/useWeather";
import { weatherEmoji } from "@/lib/weather/codes";
import { formatDisplayDate } from "@/lib/weather/date-utils";
import type { WeatherAlertLevel } from "@/lib/weather/types";
import { GlassCard } from "@/components/ui/GlassCard";

interface DayWeatherBannerProps {
  disciplineKey: DisciplineKey;
  dateIso?: string;
}

const LEVEL_STYLES: Record<
  WeatherAlertLevel,
  { border: string; badge: string; text: string }
> = {
  ok: {
    border: "border-sky-400/25",
    badge: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    text: "text-sky-200",
  },
  caution: {
    border: "border-amber-400/30",
    badge: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    text: "text-amber-200",
  },
  warning: {
    border: "border-orange-400/35",
    badge: "bg-orange-500/15 text-orange-300 border-orange-400/30",
    text: "text-orange-200",
  },
};

export function DayWeatherBanner({
  disciplineKey,
  dateIso,
}: DayWeatherBannerProps) {
  const { weather, loading, error } = useWeather(disciplineKey, dateIso);

  if (loading) {
    return (
      <GlassCard className="p-4 border border-white/8 animate-pulse">
        <p className="text-xs text-slate-500">Chargement météo…</p>
      </GlassCard>
    );
  }

  if (error || !weather) {
    return (
      <GlassCard className="p-4 border border-white/8">
        <p className="text-xs text-slate-500">
          Météo indisponible{error ? ` · ${error}` : ""}
        </p>
      </GlassCard>
    );
  }

  const { current, recommendation, location, targetDate, source } = weather;
  const styles = LEVEL_STYLES[recommendation.level];
  const emoji = weatherEmoji(current.weatherCode);
  const dateLabel = formatDisplayDate(targetDate);
  const modeLabel =
    source === "current" ? "Aujourd'hui" : `Prévision · ${dateLabel}`;

  return (
    <GlassCard className={`p-4 border-l-2 ${styles.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Météo · {location.label} · {modeLabel}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl leading-none" aria-hidden>
              {emoji}
            </span>
            <p className="text-sm font-medium text-white">
              {current.label} · {current.tempC}°C
              <span className="text-slate-500 font-normal">
                {" "}
                (ressenti {current.feelsLikeC}°C
                {source === "forecast" ? ", moy. jour" : ""})
              </span>
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
            {source === "forecast" ? "Max jour · " : ""}
            Vent {current.windKmh} km/h · Rafales {current.windGustsKmh} km/h ·
            Humidité {current.humidityPct}%
            {source === "forecast" && current.precipitationMm > 0
              ? ` · Pluie ${current.precipitationMm} mm`
              : ""}
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${styles.badge}`}
        >
          {recommendation.level === "ok"
            ? "OK"
            : recommendation.level === "caution"
              ? "Prudence"
              : "Attention"}
        </span>
      </div>

      <p className={`text-sm mt-3 leading-relaxed ${styles.text}`}>
        {recommendation.headline}
      </p>
      {recommendation.tips.length > 0 && (
        <ul className="mt-2 space-y-1">
          {recommendation.tips.map((tip) => (
            <li key={tip} className="text-xs text-slate-400 leading-relaxed">
              · {tip}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
