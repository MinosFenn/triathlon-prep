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
  dayIndex: number,
  slotId: string,
  activityIndex: number,
  segmentIndex: number
): string {
  return `d${dayIndex}-${slotId}-a${activityIndex}-s${segmentIndex}`;
}

export function buildActivityTrackingId(
  dayIndex: number,
  slotId: string,
  activityIndex: number
): string {
  return `d${dayIndex}-${slotId}-a${activityIndex}`;
}

export function countTrackableItems(slots: DayScheduleSlot[]): number {
  let count = 0;
  for (const slot of slots) {
    for (const activity of slot.activities) {
      if (activity.segments.length > 0) {
        count += activity.segments.length;
      } else {
        count += 1;
      }
    }
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
    for (let ai = 0; ai < slot.activities.length; ai++) {
      const activity = slot.activities[ai];
      const pts = bonusPointsForCategory(activity.category);

      if (activity.segments.length > 0) {
        for (let si = 0; si < activity.segments.length; si++) {
          possible += pts;
          const id = activity.segmentTrackingIds?.[si];
          if (id && completed[id]) earned += pts;
        }
      } else {
        possible += pts;
        if (activity.trackingId && completed[activity.trackingId]) {
          earned += pts;
        }
      }
    }
  }

  return { earned, possible };
}
