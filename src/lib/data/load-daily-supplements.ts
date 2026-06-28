import type { Supplement } from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";
import type {
  DailySupplementEntry,
  DailySupplementsByWeek,
  SupplementTiming,
} from "@/lib/supplements-daily";

const DAY_NAMES = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const TIMING_COLUMNS: { index: number; timing: SupplementTiming }[] = [
  { index: 1, timing: "matin" },
  { index: 2, timing: "midi" },
  { index: 3, timing: "soir" },
  { index: 4, timing: "post" },
];

let cachedDailyPlan: Record<string, DailySupplementEntry[]> | null = null;

function loadDailyPlanTemplate(): Record<string, DailySupplementEntry[]> {
  if (cachedDailyPlan) return cachedDailyPlan;

  const result: Record<string, DailySupplementEntry[]> = {};
  for (const day of DAY_NAMES) {
    result[day] = [];
  }

  try {
    const content = readContentFile("supplements.md");
    const section = extractSection(
      content,
      "Plan Hebdomadaire de Prise des Compléments"
    );
    const rows = extractMarkdownTableRows(section);

    for (const row of rows) {
      const day = row[0]?.replace(/\*\*/g, "").trim();
      if (!day || day.includes("Jour") || !result[day]) continue;

      for (const { index, timing } of TIMING_COLUMNS) {
        const cell = row[index]?.replace(/\*\*/g, "").trim() ?? "";
        if (!cell || cell === "-") continue;

        for (const part of splitSupplementCell(cell)) {
          result[day].push({ timing, name: part, dose: "" });
        }
      }
    }
  } catch {
    /* fallback below */
  }

  cachedDailyPlan = result;
  return result;
}

function splitSupplementCell(cell: string): string[] {
  return cell
    .split(/\s*\+\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function matchesActiveSupplement(
  part: string,
  active: Supplement[]
): Supplement | undefined {
  const lower = part.toLowerCase();
  return active.find((s) => {
    const name = s.name.toLowerCase();
    if (lower.includes("vitamine d") && name.includes("vitamine d")) return true;
    if (lower.includes("magnésium") || lower.includes("magnesium"))
      return name.includes("Magnésium");
    if (lower.includes("zinc")) return name.includes("Zinc");
    if (lower.includes("oméga") || lower.includes("omega"))
      return name.includes("Oméga");
    if (lower.includes("créatine") || lower.includes("creatine"))
      return name.includes("Créatine");
    return (
      lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)
    );
  });
}

function getDailySupplementsForDay(
  dayName: string,
  activeSupplements: Supplement[]
): DailySupplementEntry[] {
  const template = loadDailyPlanTemplate()[dayName] ?? [];
  if (activeSupplements.length === 0) return [];

  const entries: DailySupplementEntry[] = [];

  for (const entry of template) {
    const match = matchesActiveSupplement(entry.name, activeSupplements);
    if (match) {
      entries.push({
        timing: entry.timing,
        name: match.name,
        dose: match.dose,
      });
    }
  }

  if (entries.length === 0 && activeSupplements.length > 0) {
    return fallbackDailySupplements(dayName, activeSupplements);
  }

  return entries;
}

function fallbackDailySupplements(
  dayName: string,
  active: Supplement[]
): DailySupplementEntry[] {
  const isTraining = ["Lundi", "Mardi", "Jeudi", "Samedi"].includes(dayName);
  const entries: DailySupplementEntry[] = [];

  for (const supp of active) {
    const when = supp.when.toLowerCase();
    let timing: SupplementTiming = "soir";
    if (when.includes("matin")) timing = "matin";
    else if (when.includes("midi")) timing = "midi";
    else if (when.includes("post") || when.includes("entraînement"))
      timing = "post";

    if (timing === "post" && !isTraining) continue;

    entries.push({ timing, name: supp.name, dose: supp.dose });
  }

  return entries;
}

/** Pré-calcul serveur — évite fs côté client. */
export function loadAllDailySupplementsByWeek(
  supplementsByWeek: Record<number, Supplement[]>,
  weekCount = 13
): DailySupplementsByWeek {
  const result: DailySupplementsByWeek = {};

  for (let w = 1; w <= weekCount; w++) {
    result[w] = {};
    const active = supplementsByWeek[w] ?? [];
    for (const day of DAY_NAMES) {
      result[w][day] = getDailySupplementsForDay(day, active);
    }
  }

  return result;
}
