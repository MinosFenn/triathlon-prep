"use client";

import { useEffect, useState } from "react";
import type { AppData } from "@/types";
import { DISCIPLINE_STYLES, DISCIPLINE_CHART_COLORS, CHART_DISCIPLINES } from "@/lib/discipline";
import { computeGlobalStats, type GlobalStats } from "@/lib/storage/tracking";
import { GlassCard } from "@/components/ui/GlassCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { WeeklyProjectionChart } from "@/components/stats/WeeklyProjectionChart";

interface StatsDashboardProps {
  data: AppData;
}

export function StatsDashboard({ data }: StatsDashboardProps) {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const weekCount = data.plan.weeks.length;

  useEffect(() => {
    const trackingContext = {
      strength: data.strength,
      stretching: data.stretching,
      mental: data.mental,
      dailySupplementsByWeek: data.dailySupplementsByWeek,
    };

    setStats(
      computeGlobalStats(data.sessionsByWeek, weekCount, trackingContext)
    );

    const refresh = () =>
      setStats(
        computeGlobalStats(data.sessionsByWeek, weekCount, trackingContext)
      );
    window.addEventListener("storage", refresh);
    window.addEventListener("triathlon-tracking-update", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("triathlon-tracking-update", refresh);
    };
  }, [data, weekCount]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Chargement...
      </div>
    );
  }

  const maxDisciplinePoints = Math.max(
    ...Object.values(stats.byDiscipline).map((d) => d.pointsPossible),
    1
  );

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Suivi global
          </p>
          <h1 className="text-lg font-bold text-white mt-0.5">Statistiques</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.plan.athlete.raceName} · {data.plan.dureeTotale}
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
        <GlassCard variant="strong" className="p-5 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Points totaux
          </p>
          <p className="text-4xl font-bold text-amber-300 tabular-nums">
            {stats.totalPointsEarned + stats.bonusPointsEarned}
            <span className="text-lg text-slate-500 font-medium">
              {" "}
              / {stats.totalPointsPossible + stats.bonusPointsPossible}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {stats.pointsRate}% séances · {stats.totalCompleted}/
            {stats.totalPlanned} validées
            {stats.bonusPointsPossible > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="text-violet-300">
                  {stats.bonusPointsEarned}/{stats.bonusPointsPossible} pts
                  bonus
                </span>
              </>
            )}
          </p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Séances validées"
            value={`${stats.totalCompleted}/${stats.totalPlanned}`}
            accent="text-emerald-300"
          />
          <StatCard
            label="Semaines complètes"
            value={String(stats.currentStreak)}
            accent="text-amber-300"
          />
        </div>

        <GlassCard variant="strong" className="p-5">
          <h2 className="text-sm font-semibold text-white mb-1">
            Projection & complétion par semaine
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Volume objectif par sport + renforcement · remplissage = % complété
            · bonus +15% si semaine complète
          </p>

          <WeeklyProjectionChart
            byWeek={stats.byWeek}
            weeks={data.plan.weeks}
          />
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Points par sport
          </h2>
          <div className="space-y-3">
            {(
              Object.entries(stats.byDiscipline) as [
                keyof typeof stats.byDiscipline,
                (typeof stats.byDiscipline)[keyof typeof stats.byDiscipline],
              ][]
            )
              .filter(
                ([key, d]) =>
                  d.pointsPossible > 0 &&
                  CHART_DISCIPLINES.includes(key as (typeof CHART_DISCIPLINES)[number])
              )
              .map(([key, d]) => {
                const chartKey = key as (typeof CHART_DISCIPLINES)[number];
                const style = DISCIPLINE_STYLES[chartKey];
                const pct =
                  d.pointsPossible > 0
                    ? Math.round((d.pointsEarned / d.pointsPossible) * 100)
                    : 0;
                const barWidth = (d.pointsEarned / maxDisciplinePoints) * 100;

                return (
                  <div key={chartKey}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-medium ${style.color}`}>
                        {style.label}
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {d.pointsEarned}/{d.pointsPossible} pts · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          background: DISCIPLINE_CHART_COLORS[chartKey].earned,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-2">
            Système de points
          </h2>
          <ul className="text-sm text-slate-400 space-y-1.5 leading-relaxed">
            <li>
              Chaque séance vaut des points selon sa durée, sa zone et sa
              discipline.
            </li>
            <li>
              Coche chaque bloc (étirements, mental, compléments) sur la journée
              pour des points bonus (+4 à +6 pts par bloc).
            </li>
            <li>
              Coche &laquo; Validée &raquo; sur les séances sport et renforcement
              pour les points discipline.
            </li>
            <li>
              Semaine 100% complétée : bonus +15% des points de la semaine.
            </li>
            <li>
              Les ressentis alimentent un futur ajustement automatique par IA.
            </li>
          </ul>
        </GlassCard>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <GlassCard className="p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
    </GlassCard>
  );
}
