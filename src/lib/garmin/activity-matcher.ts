import type { DisciplineKey, TrainingSession } from "@/types";
import type { GarminActivitySummary, StoredGarminActivity } from "./types";

const TYPE_TO_DISCIPLINE: Record<string, DisciplineKey> = {
  RUNNING: "run",
  RUN: "run",
  TRAIL_RUNNING: "run",
  TREADMILL_RUNNING: "run",
  CYCLING: "bike",
  ROAD_BIKING: "bike",
  MOUNTAIN_BIKING: "bike",
  INDOOR_CYCLING: "bike",
  VIRTUAL_RIDE: "bike",
  SWIMMING: "swim",
  LAP_SWIMMING: "swim",
  OPEN_WATER_SWIMMING: "swim",
  MULTI_SPORT: "brick",
  TRIATHLON: "brick",
  STRENGTH_TRAINING: "recovery",
  YOGA: "recovery",
};

export function mapGarminTypeToDiscipline(
  activityType?: string
): DisciplineKey {
  if (!activityType) return "run";
  const key = activityType.toUpperCase().replace(/[\s-]/g, "_");
  return TYPE_TO_DISCIPLINE[key] ?? "run";
}

export function parseGarminActivity(
  raw: GarminActivitySummary
): StoredGarminActivity {
  const disciplineKey = mapGarminTypeToDiscipline(raw.activityType);
  const startSec = raw.startTimeInSeconds ?? Math.floor(Date.now() / 1000);
  const offsetSec = raw.startTimeOffsetInSeconds ?? 0;
  const startMs = (startSec + offsetSec) * 1000;
  const start = new Date(startMs);

  const dateStr = start.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Paris",
  });

  return {
    id: `garmin-${raw.activityId}`,
    garminActivityId: String(raw.activityId),
    activityType: raw.activityType ?? "UNKNOWN",
    activityName: raw.activityName ?? raw.activityType ?? "Activité Garmin",
    startDate: dateStr,
    startTimeIso: start.toISOString(),
    durationMin: Math.round((raw.durationInSeconds ?? 0) / 60),
    distanceKm: raw.distanceInMeters
      ? Math.round((raw.distanceInMeters / 1000) * 10) / 10
      : null,
    disciplineKey,
    matchedWeek: null,
    matchedDayIndex: null,
    syncedAt: new Date().toISOString(),
  };
}

function parsePlanDate(dateStr: string, year = 2026): Date | null {
  const [d, m] = dateStr.split("/").map(Number);
  if (!d || !m) return null;
  return new Date(year, m - 1, d);
}

function disciplinesCompatible(
  planned: DisciplineKey,
  actual: DisciplineKey
): boolean {
  if (planned === actual) return true;
  if (planned === "brick" && (actual === "bike" || actual === "run")) return true;
  if (actual === "brick") return true;
  return false;
}

export function matchActivityToPlan(
  activity: StoredGarminActivity,
  sessionsByWeek: Record<number, TrainingSession[]>,
  weekCount: number
): StoredGarminActivity {
  const activityDate = new Date(activity.startTimeIso);
  const activityDay = activityDate.getDate();
  const activityMonth = activityDate.getMonth();

  for (let week = 1; week <= weekCount; week++) {
    const sessions = sessionsByWeek[week] ?? [];
    for (let dayIndex = 0; dayIndex < sessions.length; dayIndex++) {
      const session = sessions[dayIndex];
      const planDate = parsePlanDate(session.date);
      if (!planDate) continue;

      if (
        planDate.getDate() === activityDay &&
        planDate.getMonth() === activityMonth &&
        disciplinesCompatible(session.disciplineKey, activity.disciplineKey)
      ) {
        return {
          ...activity,
          matchedWeek: week,
          matchedDayIndex: dayIndex,
        };
      }
    }
  }

  return activity;
}

export function matchAllActivities(
  activities: StoredGarminActivity[],
  sessionsByWeek: Record<number, TrainingSession[]>,
  weekCount: number
): StoredGarminActivity[] {
  return activities.map((a) =>
    matchActivityToPlan(a, sessionsByWeek, weekCount)
  );
}
