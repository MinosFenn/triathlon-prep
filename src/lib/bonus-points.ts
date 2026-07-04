import type { DayActivity, DayScheduleSlot } from "@/lib/day-schedule";

export const BONUS_POINTS = {
  stretching: 4,
  mental: 5,
  strength: 4,
  supplement: 6,
} as const;

export function bonusPointsForCategory(
  category: DayActivity["category"]
): number {
  return BONUS_POINTS[category];
}

export function buildSegmentTrackingId(
  weekNum: number,
  dayIndex: number,
  slotId: string,
  activityIndex: number,
  segmentIndex: number
): string {
  return `w${weekNum}-d${dayIndex}-${slotId}-a${activityIndex}-s${segmentIndex}`;
}

export function buildActivityTrackingId(
  weekNum: number,
  dayIndex: number,
  slotId: string,
  activityIndex: number
): string {
  return `w${weekNum}-d${dayIndex}-${slotId}-a${activityIndex}`;
}

/** Only expose completion state for one day (avoids cross-day checkbox bleed). */
export function filterBonusTrackingForDay(
  tracking: Record<string, boolean>,
  weekNum: number,
  dayIndex: number
): Record<string, boolean> {
  const prefix = `w${weekNum}-d${dayIndex}-`;
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(tracking)) {
    if (key.startsWith(prefix) && value) {
      result[key] = true;
    }
  }
  return result;
}

export function countTrackableItems(slots: DayScheduleSlot[]): number {
  let count = 0;
  for (const slot of slots) {
    count += slot.activities.length;
  }
  return count;
}

export function computeDayBonusPoints(
  slots: DayScheduleSlot[],
  completed: Record<string, boolean>
): { earned: number; possible: number } {
  let earned = 0;
  let possible = 0;

  for (const slot of slots) {
    for (const activity of slot.activities) {
      if (activity.category === "strength") continue;
      const pts = bonusPointsForCategory(activity.category);
      possible += pts;
      if (activity.trackingId && completed[activity.trackingId]) {
        earned += pts;
      }
    }
  }

  return { earned, possible };
}
