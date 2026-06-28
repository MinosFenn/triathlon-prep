import { loadAppData } from "@/lib/data";
import {
  matchAllActivities,
  parseGarminActivity,
} from "@/lib/garmin/activity-matcher";
import { getValidAccessToken } from "@/lib/garmin/oauth";
import {
  listGarminActivities,
  loadGarminStore,
  upsertGarminActivities,
} from "@/lib/garmin/store";
import type { GarminActivitySummary } from "@/lib/garmin/types";

interface WebhookPayload {
  activities?: GarminActivitySummary[];
  activityDetails?: GarminActivitySummary[];
  manuallyUpdatedActivities?: GarminActivitySummary[];
}

export async function processGarminWebhookPayload(
  payload: WebhookPayload
): Promise<number> {
  const summaries = [
    ...(payload.activities ?? []),
    ...(payload.activityDetails ?? []),
    ...(payload.manuallyUpdatedActivities ?? []),
  ];

  if (summaries.length === 0) return 0;

  const appData = loadAppData();
  const weekCount = appData.plan.weeks.length;

  const parsed = summaries.map(parseGarminActivity);
  const matched = matchAllActivities(
    parsed,
    appData.sessionsByWeek,
    weekCount
  );

  await upsertGarminActivities(matched);
  return matched.length;
}

/** Ping architecture: Garmin sends callback URLs to fetch */
export async function processGarminPingCallbacks(
  callbackUrls: string[]
): Promise<number> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return 0;

  let total = 0;

  for (const url of callbackUrls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as WebhookPayload | GarminActivitySummary[];
      const payload: WebhookPayload = Array.isArray(data)
        ? { activities: data }
        : (data as WebhookPayload);

      total += await processGarminWebhookPayload(payload);
    } catch (err) {
      console.error("[Garmin ping] callback fetch failed:", url, err);
    }
  }

  return total;
}

export async function getMatchedSessions() {
  const appData = loadAppData();
  const activities = await listGarminActivities();

  return activities
    .filter((a) => a.matchedWeek !== null && a.matchedDayIndex !== null)
    .map((a) => ({
      week: a.matchedWeek!,
      dayIndex: a.matchedDayIndex!,
      garminActivityId: a.garminActivityId,
      activityName: a.activityName,
      durationMin: a.durationMin,
      distanceKm: a.distanceKm,
      syncedAt: a.syncedAt,
    }));
}

export async function getGarminConnectionStatus() {
  const store = await loadGarminStore();
  const activities = store.activities;
  const matched = activities.filter((a) => a.matchedWeek !== null);

  return {
    connected: Boolean(store.tokens?.accessToken),
    tokenExpiresAt: store.tokens?.expiresAt ?? null,
    activityCount: activities.length,
    matchedCount: matched.length,
    lastSync: activities[0]?.syncedAt ?? null,
  };
}

export async function disconnectGarmin(): Promise<void> {
  const { saveGarminStore } = await import("@/lib/garmin/store");
  await saveGarminStore({ tokens: null, activities: [] });
}
