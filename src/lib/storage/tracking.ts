import type { DisciplineKey, MentalData, StrengthData, StretchingData, TrainingSession } from "@/types";
import { CHART_DISCIPLINES, type ChartDisciplineKey } from "@/lib/discipline";
import { computeDayBonusPoints } from "@/lib/bonus-points";
import { buildDaySchedule } from "@/lib/day-schedule";
import type { DailySupplementsByWeek } from "@/lib/supplements-daily";
import { WEEK_COMPLETION_BONUS_RATIO } from "@/lib/session-meta";
import { getBonusTracking } from "@/lib/storage/bonus-tracking";

export type WeekDisciplinePoints = Record<
  ChartDisciplineKey,
  {
    pointsPossible: number;
    pointsEarned: number;
    planned: number;
    completed: number;
  }
>;

function emptyWeekDisciplines(): WeekDisciplinePoints {
  return {
    swim: { pointsPossible: 0, pointsEarned: 0, planned: 0, completed: 0 },
    bike: { pointsPossible: 0, pointsEarned: 0, planned: 0, completed: 0 },
    run: { pointsPossible: 0, pointsEarned: 0, planned: 0, completed: 0 },
    brick: { pointsPossible: 0, pointsEarned: 0, planned: 0, completed: 0 },
  };
}

export interface DayTracking {
  note: string;
  completed: boolean;
}

export type WeekTracking = Record<string, DayTracking>;

const NOTES_PREFIX = "triathlon-notes-week-";

export function getWeekTracking(weekNum: number): WeekTracking {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${NOTES_PREFIX}${weekNum}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<DayTracking & { adjusted?: string }>>;
    const result: WeekTracking = {};
    for (const [key, value] of Object.entries(parsed)) {
      result[key] = {
        note: value.note ?? "",
        completed: value.completed ?? false,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export interface GlobalStats {
  totalPlanned: number;
  totalCompleted: number;
  completionRate: number;
  totalPointsEarned: number;
  totalPointsPossible: number;
  pointsRate: number;
  bonusPointsEarned: number;
  bonusPointsPossible: number;
  byWeek: {
    week: number;
    planned: number;
    completed: number;
    pointsEarned: number;
    pointsPossible: number;
    weekBonus: number;
    disciplines: WeekDisciplinePoints;
  }[];
  byDiscipline: Record<
    DisciplineKey,
    {
      planned: number;
      completed: number;
      pointsEarned: number;
      pointsPossible: number;
    }
  >;
  currentStreak: number;
}

export interface TrackingContext {
  strength: StrengthData;
  stretching: StretchingData;
  mental: MentalData;
  dailySupplementsByWeek: DailySupplementsByWeek;
}

export function computeGlobalStats(
  sessionsByWeek: Record<number, TrainingSession[]>,
  weekCount: number,
  context?: TrackingContext
): GlobalStats {
  const byWeek: GlobalStats["byWeek"] = [];
  const byDiscipline: GlobalStats["byDiscipline"] = {
    swim: { planned: 0, completed: 0, pointsEarned: 0, pointsPossible: 0 },
    bike: { planned: 0, completed: 0, pointsEarned: 0, pointsPossible: 0 },
    run: { planned: 0, completed: 0, pointsEarned: 0, pointsPossible: 0 },
    brick: { planned: 0, completed: 0, pointsEarned: 0, pointsPossible: 0 },
    recovery: { planned: 0, completed: 0, pointsEarned: 0, pointsPossible: 0 },
  };

  let totalPlanned = 0;
  let totalCompleted = 0;
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;

  for (let w = 1; w <= weekCount; w++) {
    const sessions = sessionsByWeek[w] ?? [];
    const tracking = getWeekTracking(w);
    let weekCompleted = 0;
    let weekPointsEarned = 0;
    let weekPointsPossible = 0;
    const weekDisciplines = emptyWeekDisciplines();

    sessions.forEach((session, index) => {
      const key = `day-${index}`;
      const isRecovery = session.disciplineKey === "recovery";
      if (isRecovery) return;

      totalPlanned++;
      weekPointsPossible += session.points;
      totalPointsPossible += session.points;
      byDiscipline[session.disciplineKey].planned++;
      byDiscipline[session.disciplineKey].pointsPossible += session.points;

      if (CHART_DISCIPLINES.includes(session.disciplineKey as ChartDisciplineKey)) {
        const chartKey = session.disciplineKey as ChartDisciplineKey;
        weekDisciplines[chartKey].pointsPossible += session.points;
        weekDisciplines[chartKey].planned++;
      }

      if (tracking[key]?.completed) {
        totalCompleted++;
        weekCompleted++;
        weekPointsEarned += session.points;
        totalPointsEarned += session.points;
        byDiscipline[session.disciplineKey].completed++;
        byDiscipline[session.disciplineKey].pointsEarned += session.points;

        if (CHART_DISCIPLINES.includes(session.disciplineKey as ChartDisciplineKey)) {
          const chartKey = session.disciplineKey as ChartDisciplineKey;
          weekDisciplines[chartKey].pointsEarned += session.points;
          weekDisciplines[chartKey].completed++;
        }
      }
    });

    const weekPlanned = sessions.filter((s) => s.disciplineKey !== "recovery").length;
    let weekBonus = 0;
    if (weekPlanned > 0 && weekCompleted >= weekPlanned) {
      weekBonus = Math.round(weekPointsPossible * WEEK_COMPLETION_BONUS_RATIO);
      weekPointsEarned += weekBonus;
      totalPointsEarned += weekBonus;
    }

    byWeek.push({
      week: w,
      planned: weekPlanned,
      completed: weekCompleted,
      pointsEarned: weekPointsEarned,
      pointsPossible: weekPointsPossible,
      weekBonus,
      disciplines: weekDisciplines,
    });
  }

  const completionRate =
    totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  const pointsRate =
    totalPointsPossible > 0
      ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
      : 0;

  let bonusPointsEarned = 0;
  let bonusPointsPossible = 0;

  if (context) {
    for (let w = 1; w <= weekCount; w++) {
      const sessions = sessionsByWeek[w] ?? [];
      const bonus = getBonusTracking(w);
      const dailyByDay = context.dailySupplementsByWeek[w] ?? {};

      sessions.forEach((session, dayIndex) => {
        const daily = dailyByDay[session.day] ?? [];
        const schedule = buildDaySchedule(
          session,
          w,
          context.strength,
          context.stretching,
          context.mental,
          daily,
          dayIndex
        );
        const dayBonus = computeDayBonusPoints(schedule, bonus);
        bonusPointsEarned += dayBonus.earned;
        bonusPointsPossible += dayBonus.possible;
      });
    }
  }

  return {
    totalPlanned,
    totalCompleted,
    completionRate,
    totalPointsEarned,
    totalPointsPossible,
    pointsRate,
    bonusPointsEarned,
    bonusPointsPossible,
    byWeek,
    byDiscipline,
    currentStreak: computeStreak(byWeek),
  };
}

function computeStreak(
  byWeek: { planned: number; completed: number }[]
): number {
  let streak = 0;
  for (let i = byWeek.length - 1; i >= 0; i--) {
    const { planned, completed } = byWeek[i];
    if (planned === 0) continue;
    if (completed >= planned) streak++;
    else break;
  }
  return streak;
}
