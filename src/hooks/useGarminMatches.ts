"use client";

import { useEffect, useState } from "react";

export interface GarminMatch {
  week: number;
  dayIndex: number;
  garminActivityId: string;
  activityName: string;
  durationMin: number;
  distanceKm: number | null;
  syncedAt: string;
}

export function useGarminMatches() {
  const [matches, setMatches] = useState<GarminMatch[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, matchRes] = await Promise.all([
          fetch("/api/garmin/status"),
          fetch("/api/garmin/matches"),
        ]);
        const status = await statusRes.json();
        const matchData = await matchRes.json();
        setConnected(status.connected ?? false);
        setMatches(matchData.matches ?? []);
      } catch {
        /* offline / not configured */
      }
    }

    load();
  }, []);

  function isGarminMatched(week: number, dayIndex: number): GarminMatch | undefined {
    return matches.find((m) => m.week === week && m.dayIndex === dayIndex);
  }

  return { matches, connected, isGarminMatched };
}

/** Merge Garmin matches into local notes — auto-validates matched sessions */
export function applyGarminMatchesToNotes(
  week: number,
  notes: Record<string, { note: string; completed?: boolean }>,
  matches: GarminMatch[]
): Record<string, { note: string; completed?: boolean }> {
  const weekMatches = matches.filter((m) => m.week === week);
  if (weekMatches.length === 0) return notes;

  let changed = false;
  const merged = { ...notes };
  for (const m of weekMatches) {
    const key = `day-${m.dayIndex}`;
    const existing = merged[key];
    if (existing?.completed) continue;
    changed = true;
    merged[key] = {
      note: existing?.note ?? "",
      completed: true,
    };
  }
  return changed ? merged : notes;
}
