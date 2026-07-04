import type {
  StrengthData,
  StrengthSession,
  TrainingSession,
} from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";
import { computeStrengthPoints } from "@/lib/session-meta";

const DAY_INDEX: Record<string, number> = {
  Lun: 0,
  Mar: 1,
  Mer: 2,
  Jeu: 3,
  Ven: 4,
  Sam: 5,
  Dim: 6,
};

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

function parseDurationMin(duration: string): number {
  const min = duration.match(/(\d+)\s*min/i);
  return min ? parseInt(min[1], 10) : 25;
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
  const duration = template?.duration ?? "25 min";
  const estimatedMinutes = parseDurationMin(duration);

  return {
    day,
    type: template?.type ?? (isLegs ? "Jambes + Gainage" : "Haut du corps + Gainage"),
    duration,
    exercises,
    estimatedMinutes,
    points: computeStrengthPoints(estimatedMinutes),
  };
}

function getDescription(
  weekNum: number,
  progression: ReturnType<typeof extractProgression>
): string {
  if (weekNum <= 4) return `Semaines 1–4: ${progression.phase1}`;
  if (weekNum <= 8) return `Semaines 5–8: ${progression.phase2}`;
  return `Semaines 9–12: ${progression.phase3}`;
}

/** Brick, tests FTP/chrono et race day : pas de renfo ce jour-là. */
export function isHeavyTrainingDay(session: TrainingSession): boolean {
  if (session.disciplineKey === "recovery" || session.disciplineKey === "brick") {
    return true;
  }
  if (/brick/i.test(session.discipline)) return true;

  const type = session.type.toLowerCase();
  if (/test|ftp|race day|race\s*day/.test(type)) return true;
  if (session.notes?.startsWith("TEST:")) return true;

  return false;
}

/** Score bas = journée légère, idéale pour le renfo le soir. */
function sessionLoadScore(session: TrainingSession): number {
  let score = session.estimatedMinutes;

  const zone = session.zone.toLowerCase();
  if (/z4|z5|race|4-5|3-4|2-4/.test(zone)) score += 50;
  else if (/z3|2-3|3-4/.test(zone)) score += 25;
  else if (/z1|1-2/.test(zone)) score -= 10;

  if (session.disciplineKey === "swim") score -= 8;

  return score;
}

function daysApart(a: string, b: string): number {
  return Math.abs((DAY_INDEX[a] ?? 0) - (DAY_INDEX[b] ?? 0));
}

/** Choisit 2 jours les plus légers, espacés d'au moins 2 jours. */
export function pickStrengthDays(
  sessions: TrainingSession[]
): [string, string] {
  const ranked = sessions
    .filter((s) => s.disciplineKey !== "recovery" && !isHeavyTrainingDay(s))
    .map((s) => ({ day: s.dayShort, score: sessionLoadScore(s) }))
    .sort((a, b) => a.score - b.score);

  const fallback: [string, string] = ["Mar", "Ven"];
  if (ranked.length === 0) return fallback;
  if (ranked.length === 1) return [ranked[0].day, ranked[0].day];

  const first = ranked[0].day;
  const spaced =
    ranked.find((r, i) => i > 0 && daysApart(r.day, first) >= 2) ??
    ranked[1];

  return [first, spaced.day];
}

function getSessionsForWeek(
  weekNum: number,
  weeklyPlan: ReturnType<typeof extractWeeklyStrengthPlan>,
  weekSessions: TrainingSession[]
): StrengthSession[] {
  const reps = weekNum <= 4 ? "3×12" : weekNum <= 8 ? "4×12" : "4×10";

  const legs = weeklyPlan.find((s) => s.type.includes("Jambes"));
  const upper = weeklyPlan.find((s) => s.type.includes("Haut"));

  const [legsDay, upperDay] = pickStrengthDays(weekSessions);

  return [
    buildSession(legsDay, legs, reps),
    buildSession(upperDay, upper, reps),
  ];
}

export function loadStrengthData(
  sessionsByWeek: Record<number, TrainingSession[]>
): StrengthData {
  const content = readContentFile("strength.md");
  const weeklyPlan = extractWeeklyStrengthPlan(content);
  const progression = extractProgression(content);

  const descriptionsByWeek: Record<number, string> = {};
  const sessionsByWeekOut: Record<number, StrengthSession[]> = {};

  for (let w = 1; w <= 13; w++) {
    descriptionsByWeek[w] = getDescription(w, progression);
    sessionsByWeekOut[w] = getSessionsForWeek(
      w,
      weeklyPlan,
      sessionsByWeek[w] ?? []
    );
  }

  return { descriptionsByWeek, sessionsByWeek: sessionsByWeekOut };
}
