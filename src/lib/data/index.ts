import type { AppData } from "@/types";
import {
  getTipsForWeek,
  loadAllSessions,
  loadCalendar,
  loadTriathlonPlan,
} from "@/lib/data/load-plan";
import { loadNutrition } from "@/lib/data/load-nutrition";
import { loadAllSupplementsByWeek } from "@/lib/data/load-supplements";
import { loadAllDailySupplementsByWeek } from "@/lib/data/load-daily-supplements";
import { loadStrengthData } from "@/lib/data/load-strength";
import { loadStretching } from "@/lib/data/load-stretching";
import { loadMental } from "@/lib/data/load-mental";
import { loadLocations } from "@/lib/data/load-locations";

let cachedData: AppData | null = null;

/** Invalide le cache serveur (utile après modification des .md en dev). */
export function clearAppDataCache(): void {
  cachedData = null;
}

/** Charge toutes les données au build time (Server Component) */
export function loadAppData(): AppData {
  if (process.env.NODE_ENV === "production" && cachedData) {
    return cachedData;
  }

  const tipsByWeek: Record<number, string[]> = {};
  for (let w = 1; w <= 13; w++) {
    tipsByWeek[w] = getTipsForWeek(w);
  }

  const supplementsByWeek = loadAllSupplementsByWeek();

  const sessionsByWeek = loadAllSessions();

  const data: AppData = {
    plan: loadTriathlonPlan(),
    sessionsByWeek,
    nutrition: loadNutrition(),
    supplementsByWeek,
    dailySupplementsByWeek: loadAllDailySupplementsByWeek(supplementsByWeek),
    strength: loadStrengthData(sessionsByWeek),
    stretching: loadStretching(),
    mental: loadMental(),
    calendar: loadCalendar(),
    tipsByWeek,
    locations: loadLocations(),
  };

  if (process.env.NODE_ENV === "production") {
    cachedData = data;
  }

  return data;
}
