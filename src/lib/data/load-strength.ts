import type { StrengthData, StrengthSession } from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";

function extractWeeklyStrengthPlan(
  content: string
): { day: string; type: string; duration: string; focus: string }[] {
  const section = extractSection(content, "Plan Hebdomadaire de Renforcement");
  const rows = extractMarkdownTableRows(section);

  return rows
    .filter((row) => row[0] && !row[0].includes("Jour"))
    .map((row) => ({
      day: row[0].replace(/\*\*/g, "").trim(),
      type: row[1]?.replace(/\*\*/g, "").trim() ?? "",
      focus: row[2]?.trim() ?? "",
      duration: row[3]?.trim() ?? "25 min",
    }));
}

function extractProgression(content: string): {
  phase1: string;
  phase2: string;
  phase3: string;
} {
  const section = extractSection(content, "Progression sur 12 Semaines");
  const rows = extractMarkdownTableRows(section);
  const dataRow = rows.find((r) => r[0]?.includes("1"));

  return {
    phase1: dataRow?.[1] ?? "3×12 (poids du corps)",
    phase2: dataRow?.[2] ?? "4×12 (+ haltères)",
    phase3: dataRow?.[3] ?? "4×10 (explosif)",
  };
}

function buildSession(
  day: string,
  template: { type: string; duration: string; focus: string } | undefined,
  reps: string
): StrengthSession {
  const isLegs = template?.type.includes("Jambes");
  const exercises = isLegs
    ? `Squats, fentes, mollets excentriques (focus mollet droit), planche — ${reps}`
    : `Pompes, tractions, superman, gainage latéral — ${reps}`;

  return {
    day,
    type: template?.type ?? (isLegs ? "Jambes + Gainage" : "Haut du corps + Gainage"),
    duration: template?.duration ?? "25 min",
    exercises,
  };
}

function getDescription(weekNum: number, progression: ReturnType<typeof extractProgression>): string {
  if (weekNum <= 4) return `Semaines 1–4: ${progression.phase1}`;
  if (weekNum <= 8) return `Semaines 5–8: ${progression.phase2}`;
  return `Semaines 9–12: ${progression.phase3}`;
}

function getSessionsForWeek(
  weekNum: number,
  weeklyPlan: ReturnType<typeof extractWeeklyStrengthPlan>
): StrengthSession[] {
  const reps = weekNum <= 4 ? "3×12" : weekNum <= 8 ? "4×12" : "4×10";
  const isOdd = weekNum % 2 === 1;

  const legs = weeklyPlan.find((s) => s.type.includes("Jambes"));
  const upper = weeklyPlan.find((s) => s.type.includes("Haut"));

  if (isOdd) {
    return [buildSession("Mar", legs, reps), buildSession("Ven", upper, reps)];
  }
  return [buildSession("Lun", legs, reps), buildSession("Jeu", upper, reps)];
}

export function loadStrengthData(): StrengthData {
  const content = readContentFile("strength.md");
  const weeklyPlan = extractWeeklyStrengthPlan(content);
  const progression = extractProgression(content);

  const descriptionsByWeek: Record<number, string> = {};
  const sessionsByWeek: Record<number, StrengthSession[]> = {};

  for (let w = 1; w <= 13; w++) {
    descriptionsByWeek[w] = getDescription(w, progression);
    sessionsByWeek[w] = getSessionsForWeek(w, weeklyPlan);
  }

  return { descriptionsByWeek, sessionsByWeek };
}
