import type { DisciplineKey } from "@/types";

export interface GarminTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
  garminUserId?: string;
}

export interface GarminActivitySummary {
  activityId: string | number;
  activityName?: string;
  activityType?: string;
  startTimeInSeconds?: number;
  startTimeOffsetInSeconds?: number;
  durationInSeconds?: number;
  distanceInMeters?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  userAccessToken?: string;
}

export interface StoredGarminActivity {
  id: string;
  garminActivityId: string;
  activityType: string;
  activityName: string;
  startDate: string;
  startTimeIso: string;
  durationMin: number;
  distanceKm: number | null;
  disciplineKey: DisciplineKey;
  matchedWeek: number | null;
  matchedDayIndex: number | null;
  syncedAt: string;
}

export interface SessionMatch {
  week: number;
  dayIndex: number;
  activity: StoredGarminActivity;
}

export interface GarminStoreData {
  tokens: GarminTokens | null;
  activities: StoredGarminActivity[];
}
