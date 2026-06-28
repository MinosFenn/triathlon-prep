"use client";

import type { GlobalStats } from "@/lib/storage/tracking";
import type { WeekPlan } from "@/types";
import {
  CHART_DISCIPLINES,
  DISCIPLINE_CHART_COLORS,
  DISCIPLINE_STYLES,
} from "@/lib/discipline";

const CHART_HEIGHT = 180;

interface WeeklyProjectionChartProps {
  byWeek: GlobalStats["byWeek"];
  weeks: WeekPlan[];
}

function isTaperWeek(week: WeekPlan): boolean {
  const obj = week.objective.toLowerCase();
  return obj.includes("taper") || obj.includes("race week");
}

export function WeeklyProjectionChart({
  byWeek,
  weeks,
}: WeeklyProjectionChartProps) {
  const maxWeekPoints = Math.max(...byWeek.map((w) => w.pointsPossible), 1);

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {CHART_DISCIPLINES.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 overflow-hidden rounded-sm">
              <span
                className="flex-1"
                style={{ background: DISCIPLINE_CHART_COLORS[key].goal }}
              />
              <span
                className="flex-1"
                style={{ background: DISCIPLINE_CHART_COLORS[key].earned }}
              />
            </span>
            <span
              className={`text-[10px] font-medium ${DISCIPLINE_STYLES[key].color}`}
            >
              {DISCIPLINE_STYLES[key].label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-400/50 bg-amber-400/10" />
          <span className="text-[10px] font-medium text-amber-300/80">
            Affûtage
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-8">
          {[100, 75, 50, 25].map((pct) => (
            <div
              key={pct}
              className="border-t border-dashed border-white/6"
              style={{ marginTop: pct === 100 ? 0 : undefined }}
            />
          ))}
        </div>

        <div
          className="relative flex items-end gap-1 pb-8"
          style={{ height: CHART_HEIGHT + 48 }}
        >
          {byWeek.map((w) => {
            const weekMeta = weeks.find((wk) => wk.num === w.week);
            const taper = weekMeta ? isTaperWeek(weekMeta) : false;
            const barPx = Math.max(
              2,
              Math.round((w.pointsPossible / maxWeekPoints) * CHART_HEIGHT)
            );
            const weekPct =
              w.planned > 0
                ? Math.round((w.completed / w.planned) * 100)
                : 0;

            const segments = CHART_DISCIPLINES.map((key) => ({
              key,
              ...w.disciplines[key],
            })).filter((d) => d.pointsPossible > 0);

            return (
              <div
                key={w.week}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
                style={{ height: CHART_HEIGHT + 48 }}
              >
                <span
                  className={`mb-1 text-[9px] font-semibold tabular-nums ${
                    weekPct > 0 ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {weekPct > 0 ? `${weekPct}%` : ""}
                </span>

                <div
                  className={`relative w-full overflow-hidden rounded-t-md border ${
                    taper
                      ? "border-amber-400/35 ring-1 ring-amber-400/15"
                      : "border-white/10"
                  }`}
                  style={{ height: barPx }}
                  title={`S${w.week} · objectif ${w.pointsPossible} pts · ${w.completed}/${w.planned} séances`}
                >
                  <div className="flex h-full w-full flex-col-reverse">
                    {segments.map(
                      ({
                        key,
                        pointsPossible,
                        pointsEarned,
                        planned,
                        completed,
                      }) => {
                        const segPct =
                          pointsPossible > 0
                            ? Math.round((pointsEarned / pointsPossible) * 100)
                            : planned > 0
                              ? Math.round((completed / planned) * 100)
                              : 0;
                        const segHeightPx =
                          (pointsPossible / w.pointsPossible) * barPx;
                        const colors = DISCIPLINE_CHART_COLORS[key];
                        const showLabel = segHeightPx >= 14;

                        return (
                          <div
                            key={key}
                            className="relative w-full"
                            style={{
                              flex: pointsPossible,
                              minHeight: pointsPossible > 0 ? 2 : 0,
                            }}
                            title={`${DISCIPLINE_STYLES[key].label}: ${completed}/${planned} séances · ${pointsEarned}/${pointsPossible} pts (${segPct}%)`}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ background: colors.goal }}
                            />
                            <div
                              className="absolute bottom-0 left-0 right-0 transition-all"
                              style={{
                                height: `${segPct}%`,
                                background: colors.earned,
                                minHeight: pointsEarned > 0 ? 1 : 0,
                              }}
                            />
                            {showLabel && (
                              <span className="absolute inset-0 z-10 flex items-center justify-center text-[7px] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {segPct}%
                              </span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <span
                  className={`mt-1.5 text-[9px] font-semibold ${
                    taper ? "text-amber-300/90" : "text-slate-400"
                  }`}
                >
                  S{w.week}
                </span>
                <span className="text-[8px] tabular-nums text-slate-600">
                  {w.pointsPossible}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-slate-600 text-center mt-1">
        Hauteur = objectif hebdo (pts) · chiffre sous la barre · % = complétion
        par sport
      </p>
    </div>
  );
}
