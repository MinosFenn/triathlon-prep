import type { DisciplineKey } from "@/types";

export interface SessionSegment {
  label: string;
  description: string;
  durationMin: number;
  durationLabel?: string;
}

export interface SessionMeta {
  segments: SessionSegment[];
  estimatedMinutes: number;
  points: number;
}

const ZONE_MULTIPLIER: Record<string, number> = {
  Z1: 0.9,
  Z2: 1,
  "Z2-3": 1.05,
  "Z2-4": 1.1,
  Z3: 1.15,
  "Z3-4": 1.25,
  Z4: 1.35,
  Z5: 1.5,
  Race: 1.4,
};

const POINTS_PER_MIN: Record<DisciplineKey, number> = {
  swim: 2.4,
  bike: 2,
  run: 2.2,
  brick: 2.6,
  recovery: 0.7,
};

export function enrichSessionMeta(
  disciplineKey: DisciplineKey,
  type: string,
  details: string,
  zone: string
): SessionMeta {
  const segments = parseSegments(disciplineKey, type, details);
  const estimatedMinutes =
    segments.reduce((sum, s) => sum + s.durationMin, 0) ||
    estimateFallbackMinutes(disciplineKey, details);
  const points = computePoints(disciplineKey, zone, estimatedMinutes, type);

  return { segments, estimatedMinutes, points };
}

function parseSegments(
  disciplineKey: DisciplineKey,
  type: string,
  details: string
): SessionSegment[] {
  const explicitMin = details.match(/(\d+)\s*min/i);
  if (disciplineKey === "recovery" && explicitMin) {
    return [
      {
        label: type,
        description: details,
        durationMin: parseInt(explicitMin[1], 10),
      },
    ];
  }

  const parts = details.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    const single = buildSegment(disciplineKey, type, details);
    return single ? [single] : [];
  }

  return parts
    .map((part, i) => buildSegment(disciplineKey, inferPartLabel(part, i), part))
    .filter((s): s is SessionSegment => s !== null);
}

function inferPartLabel(part: string, index: number): string {
  const lower = part.toLowerCase();
  if (lower.includes("échauff") || lower.includes("echauff")) return "Échauffement";
  if (lower.includes("cool-down") || lower.includes("cool down")) return "Cool-down";
  if (lower.includes("sprint")) return "Sprints";
  if (lower.includes("course") && index > 0) return "Course";
  if (lower.includes("vélo") || lower.includes("km")) return index === 0 ? "Vélo" : "Bloc";
  if (lower.includes("x") && lower.includes("min")) return "Intervalles";
  return `Bloc ${index + 1}`;
}

function buildSegment(
  disciplineKey: DisciplineKey,
  label: string,
  text: string
): SessionSegment | null {
  const durationMin = estimatePartMinutes(disciplineKey, text);
  if (durationMin <= 0) return null;
  return { label, description: text, durationMin };
}

function estimatePartMinutes(disciplineKey: DisciplineKey, text: string): number {
  const intervalMatch = text.match(/(\d+)\s*x\s*(\d+)\s*min/i);
  if (intervalMatch) {
    const reps = parseInt(intervalMatch[1], 10);
    const workMin = parseInt(intervalMatch[2], 10);
    const recMatch = text.match(/récup\s*(\d+)\s*min/i);
    const recMin = recMatch ? parseInt(recMatch[1], 10) : 2;
    return reps * (workMin + recMin);
  }

  const explicit = text.match(/(\d+)\s*min/i);
  if (explicit && !/\d+\s*x\s*\d+\s*min/i.test(text)) {
    return parseInt(explicit[1], 10);
  }

  let total = 0;

  const swimM = text.match(/([\d,.]+)\s*m(?:\b|(?=\s|:))/i);
  if (swimM) {
    const meters = parseFloat(swimM[1].replace(",", "."));
    const paceMatch = text.match(/1:(\d{2})/);
    const secPer100 = paceMatch ? 60 + parseInt(paceMatch[1], 10) : 120;
    total += (meters / 100) * (secPer100 / 60);
  }

  const kmMatch = text.match(/([\d,.]+)\s*km/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1].replace(",", "."));
    if (disciplineKey === "bike" || disciplineKey === "brick" || text.toLowerCase().includes("vélo")) {
      total += km * 2.8;
    } else {
      total += km * 5.5;
    }
  }

  const swimIntervals = text.match(/(\d+)\s*x\s*(\d+)\s*m/i);
  if (swimIntervals && !kmMatch) {
    const reps = parseInt(swimIntervals[1], 10);
    const dist = parseInt(swimIntervals[2], 10);
    total += (reps * dist) / 100 * 2;
    const recSec = text.match(/récup\s*(\d+)\s*s/i);
    if (recSec) total += (reps * parseInt(recSec[1], 10)) / 60;
  }

  if (total > 0) return Math.round(total);

  if (disciplineKey === "recovery") return 30;
  return 45;
}

function estimateFallbackMinutes(disciplineKey: DisciplineKey, details: string): number {
  const m = estimatePartMinutes(disciplineKey, details);
  return m > 0 ? m : disciplineKey === "recovery" ? 30 : 60;
}

function computePoints(
  disciplineKey: DisciplineKey,
  zone: string,
  estimatedMinutes: number,
  type: string
): number {
  const zoneKey = Object.keys(ZONE_MULTIPLIER).find((z) =>
    zone.toUpperCase().includes(z.replace("-", ""))
  );
  const zoneMult =
    ZONE_MULTIPLIER[zone] ??
    ZONE_MULTIPLIER[zoneKey ?? "Z2"] ??
    1;
  const testBoost =
    type.toLowerCase().includes("test") || type.toLowerCase().includes("ftp")
      ? 1.2
      : 1;

  const raw = estimatedMinutes * POINTS_PER_MIN[disciplineKey] * zoneMult * testBoost;
  return Math.max(15, Math.round(raw));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export const WEEK_COMPLETION_BONUS_RATIO = 0.15;
