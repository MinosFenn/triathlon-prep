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

let cachedData: AppData | null = null;

/** Charge toutes les données au build time (Server Component) */
export function loadAppData(): AppData {
  if (cachedData) return cachedData;

  const tipsByWeek: Record<number, string[]> = {};
  for (let w = 1; w <= 13; w++) {
    tipsByWeek[w] = getTipsForWeek(w);
  }

  const supplementsByWeek = loadAllSupplementsByWeek();

  cachedData = {
    plan: loadTriathlonPlan(),
    sessionsByWeek: loadAllSessions(),
    nutrition: loadNutrition(),
    supplementsByWeek,
    dailySupplementsByWeek: loadAllDailySupplementsByWeek(supplementsByWeek),
    strength: loadStrengthData(),
    stretching: loadStretching(),
    mental: loadMental(),
    calendar: loadCalendar(),
    tipsByWeek,
  };

  return cachedData;
}
