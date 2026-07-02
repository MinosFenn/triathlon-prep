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

/** ~25 km/h endurance vélo */
const BIKE_MIN_PER_KM = 2.4;

export function enrichSessionMeta(
  disciplineKey: DisciplineKey,
  type: string,
  details: string,
  zone: string
): SessionMeta {
  const parsed = parseSessionStructure(disciplineKey, type, details);
  const points = computePoints(
    disciplineKey,
    zone,
    parsed.estimatedMinutes,
    type
  );
  return { ...parsed, points };
}

function parseSessionStructure(
  disciplineKey: DisciplineKey,
  type: string,
  details: string
): { segments: SessionSegment[]; estimatedMinutes: number } {
  const text = details.trim();

  if (disciplineKey === "recovery") {
    return parseRecoverySession(type, text);
  }

  if (disciplineKey === "brick" || isBrickSession(text)) {
    return parseBrickSession(type, text);
  }

  if (disciplineKey === "swim" || looksLikeSwim(text)) {
    return parseSwimSession(type, text);
  }

  if (disciplineKey === "run" || extractRunKm(text) !== null) {
    return parseRunSession(type, text);
  }

  if (disciplineKey === "bike" || extractBikeKm(text) !== null) {
    return parseBikeSession(type, text);
  }

  const fallback = estimateGenericMinutes(disciplineKey, text);
  return {
    segments: [{ label: type, description: text, durationMin: fallback }],
    estimatedMinutes: fallback,
  };
}

function isBrickSession(text: string): boolean {
  return /\+\s*\d+[\d,.]*\s*km\s+course/i.test(text) || /brick/i.test(text);
}

function looksLikeSwim(text: string): boolean {
  return /\d[\d,.]*\s*m\b/i.test(text) && !/\d[\d,.]*\s*km/i.test(text);
}

function parseRecoverySession(type: string, text: string) {
  const explicit = text.match(/(\d+)\s*min/i);
  const minutes = explicit ? parseInt(explicit[1], 10) : 30;
  return {
    segments: [{ label: type, description: text, durationMin: minutes }],
    estimatedMinutes: minutes,
  };
}

function parseBrickSession(type: string, text: string) {
  const parts = text.split(/\s*\+\s*/).map((p) => p.trim());
  const segments: SessionSegment[] = [];
  let total = 0;

  for (const part of parts) {
    const bikeKm = extractBikeKm(part);
    const runKm = extractRunKm(part);
    if (bikeKm !== null) {
      const min = Math.round(bikeKm * BIKE_MIN_PER_KM);
      segments.push({ label: "Vélo", description: part, durationMin: min });
      total += min;
    } else if (runKm !== null) {
      const min = Math.round(runKm * parseRunPaceMinPerKm(part));
      segments.push({ label: "Course", description: part, durationMin: min });
      total += min;
    }
  }

  if (segments.length === 0) {
    const min = estimateGenericMinutes("brick", text);
    return {
      segments: [{ label: type, description: text, durationMin: min }],
      estimatedMinutes: min,
    };
  }

  return { segments, estimatedMinutes: total };
}

function parseSwimSession(type: string, text: string) {
  const totalMeters = extractSwimTotalMeters(text);
  const paceSecPer100 = extractSwimPaceSecPer100(text) ?? 115;

  if (totalMeters) {
    let totalMin = Math.max(
      15,
      Math.round((totalMeters / 100) * (paceSecPer100 / 60))
    );

    const extraParts = text.split(/\s*\+\s*/).slice(1);
    for (const extra of extraParts) {
      if (/sprint|x\s*\d+\s*m/i.test(extra)) {
        const sprintM = extractSwimDistanceMeters(extra);
        if (sprintM) {
          totalMin += Math.max(3, Math.round((sprintM / 100) * 1.5));
        }
      }
    }

    const innerParts = text.includes(":")
      ? text.split(":").slice(1).join(":").split(/\s*\+\s*/)
      : text.split(/\s*\+\s*/).filter((p) => !/continu/i.test(p));

    if (innerParts.length > 1 && text.includes(":")) {
      const segments = innerParts
        .map((part, i) => {
          const meters = extractSwimDistanceMeters(part);
          const min =
            meters !== null
              ? Math.round((meters / 100) * (paceSecPer100 / 60))
              : 0;
          return min > 0
            ? {
                label: inferSwimLabel(part, i),
                description: part.trim(),
                durationMin: min,
              }
            : null;
        })
        .filter((s): s is SessionSegment => s !== null);

      if (segments.length > 0) {
        const segSum = segments.reduce((s, x) => s + x.durationMin, 0);
        if (segSum > 0 && Math.abs(segSum - totalMin) > 5) {
          scaleSegmentsToTotal(segments, totalMin);
        }
        return { segments, estimatedMinutes: totalMin };
      }
    }

    return {
      segments: [{ label: type, description: text, durationMin: totalMin }],
      estimatedMinutes: totalMin,
    };
  }

  const intervalBlock = parseSwimIntervals(text);
  if (intervalBlock) return intervalBlock;

  const fallback = estimateGenericMinutes("swim", text);
  return {
    segments: [{ label: type, description: text, durationMin: fallback }],
    estimatedMinutes: fallback,
  };
}

function parseRunSession(type: string, text: string) {
  const km = extractRunKm(text);
  if (km === null) {
    const fallback = estimateGenericMinutes("run", text);
    return {
      segments: [{ label: type, description: text, durationMin: fallback }],
      estimatedMinutes: fallback,
    };
  }

  const pace = parseRunPaceMinPerKm(text);
  const totalMin = Math.round(km * pace);
  const intervals = parseIntervalBlock(text);

  if (intervals && text.includes("x")) {
    return {
      segments: [
        {
          label: "Course",
          description: text.replace(parseIntervalBlock(text)?.raw ?? "", "").trim() || `${km} km`,
          durationMin: Math.max(totalMin - intervals.minutes, 0) || totalMin,
        },
        {
          label: "Intervalles",
          description: intervals.raw,
          durationMin: intervals.minutes,
        },
      ].filter((s) => s.durationMin > 0),
      estimatedMinutes: totalMin,
    };
  }

  return {
    segments: [{ label: type, description: text, durationMin: totalMin }],
    estimatedMinutes: totalMin,
  };
}

function parseBikeSession(type: string, text: string) {
  const km = extractBikeKm(text);
  const intervals = parseIntervalBlock(text);
  const totalMin = km !== null ? Math.round(km * BIKE_MIN_PER_KM) : 0;

  if (km !== null && intervals) {
    const intervalMin = Math.min(intervals.minutes, totalMin);
    const enduranceMin = Math.max(totalMin - intervalMin, 0);
    return {
      segments: [
        {
          label: "Vélo",
          description: text.split(/:|\+\s*(?=\d+x)/i)[0]?.trim() || `${km} km`,
          durationMin: enduranceMin || totalMin,
        },
        {
          label: "Intervalles",
          description: intervals.raw,
          durationMin: intervalMin,
          durationLabel: formatIntervalLabel(intervals),
        },
      ].filter((s) => s.durationMin > 0),
      estimatedMinutes: totalMin,
    };
  }

  if (km !== null) {
    return {
      segments: [{ label: type, description: text, durationMin: totalMin }],
      estimatedMinutes: totalMin,
    };
  }

  if (intervals) {
    return {
      segments: [
        { label: "Intervalles", description: intervals.raw, durationMin: intervals.minutes },
      ],
      estimatedMinutes: intervals.minutes,
    };
  }

  const fallback = estimateGenericMinutes("bike", text);
  return {
    segments: [{ label: type, description: text, durationMin: fallback }],
    estimatedMinutes: fallback,
  };
}

function parseIntervalBlock(text: string): { minutes: number; raw: string } | null {
  const match = text.match(
    /(\d+)\s*x\s*(\d+)\s*min[^.]*?(?:récup\s*(\d+)\s*min)?/i
  );
  if (!match) return null;
  const reps = parseInt(match[1], 10);
  const work = parseInt(match[2], 10);
  const rec = match[3] ? parseInt(match[3], 10) : 2;
  return {
    minutes: reps * (work + rec),
    raw: match[0],
  };
}

function formatIntervalLabel(intervals: { minutes: number; raw: string }): string {
  const m = intervals.raw.match(/(\d+)\s*x\s*(\d+)\s*min/i);
  if (m) return `${m[1]}×${m[2]} min`;
  return `${intervals.minutes} min`;
}

function parseSwimIntervals(text: string) {
  const match = text.match(/(\d+)\s*x\s*(\d+)\s*m/i);
  if (!match) return null;
  const reps = parseInt(match[1], 10);
  const dist = parseInt(match[2], 10);
  const paceSec = extractSwimPaceSecPer100(text) ?? 110;
  const recSec = text.match(/récup\s*(\d+)\s*s/i);
  const rec = recSec ? parseInt(recSec[1], 10) : 20;
  const workMin = ((reps * dist) / 100) * (paceSec / 60);
  const recMin = (reps * rec) / 60;
  const totalMin = Math.round(workMin + recMin);
  return {
    segments: [
      {
        label: "Séries",
        description: match[0],
        durationMin: totalMin,
      },
    ],
    estimatedMinutes: totalMin,
  };
}

function extractSwimTotalMeters(text: string): number | null {
  const head = text.match(/^([\d,.]+)\s*m\b/i);
  if (head) return parseFloat(head[1].replace(",", "."));
  const continu = text.match(/([\d,.]+)\s*m\s+continu/i);
  if (continu) return parseFloat(continu[1].replace(",", "."));
  return null;
}

function extractSwimDistanceMeters(text: string): number | null {
  const interval = text.match(/(\d+)\s*x\s*(\d+)\s*m/i);
  if (interval) return parseInt(interval[1], 10) * parseInt(interval[2], 10);
  const single = text.match(/([\d,.]+)\s*m\b/i);
  if (single) return parseFloat(single[1].replace(",", "."));
  return null;
}

function extractSwimPaceSecPer100(text: string): number | null {
  const range = text.match(/1:(\d{2})\s*[–-]\s*2:(\d{2})\s*\/\s*100\s*m/i);
  if (range) {
    const a = 60 + parseInt(range[1], 10);
    const b = 60 + parseInt(range[2], 10);
    return Math.round((a + b) / 2);
  }
  const pace = text.match(/1:(\d{2})\s*\/\s*100\s*m/i);
  if (pace) return 60 + parseInt(pace[1], 10);
  return null;
}

function inferSwimLabel(part: string, index: number): string {
  const lower = part.toLowerCase();
  if (lower.includes("échauff") || lower.includes("echauff")) return "Échauffement";
  if (lower.includes("cool")) return "Cool-down";
  if (lower.includes("sprint")) return "Sprints";
  if (/\d+\s*x/i.test(part)) return "Séries";
  return index === 0 ? "Natation" : `Bloc ${index + 1}`;
}

function extractBikeKm(text: string): number | null {
  const km = text.match(/([\d,.]+)\s*km/i);
  if (!km) return null;
  return parseFloat(km[1].replace(",", "."));
}

function extractRunKm(text: string): number | null {
  if (/course/i.test(text) && /([\d,.]+)\s*km/i.test(text)) {
    const km = text.match(/([\d,.]+)\s*km/i);
    return km ? parseFloat(km[1].replace(",", ".")) : null;
  }
  if (!/([\d,.]+)\s*km/i.test(text)) return null;
  if (/vélo|bike|plat\s*:/i.test(text) && !/course/i.test(text)) return null;
  const km = text.match(/([\d,.]+)\s*km/i);
  return km ? parseFloat(km[1].replace(",", ".")) : null;
}

function parseRunPaceMinPerKm(text: string): number {
  const range = text.match(
    /(\d):(\d{2})\s*[–-]\s*(\d):(\d{2})\s*\/?\s*km/i
  );
  if (range) {
    const a = parseInt(range[1], 10) + parseInt(range[2], 10) / 60;
    const b = parseInt(range[3], 10) + parseInt(range[4], 10) / 60;
    return (a + b) / 2;
  }
  const single = text.match(/(\d):(\d{2})\s*\/?\s*km/i);
  if (single) {
    return parseInt(single[1], 10) + parseInt(single[2], 10) / 60;
  }
  return 5.75;
}

function scaleSegmentsToTotal(segments: SessionSegment[], totalMin: number) {
  const sum = segments.reduce((s, x) => s + x.durationMin, 0);
  if (sum <= 0) return;
  let allocated = 0;
  for (let i = 0; i < segments.length; i++) {
    if (i === segments.length - 1) {
      segments[i].durationMin = Math.max(1, totalMin - allocated);
    } else {
      const scaled = Math.max(1, Math.round((segments[i].durationMin / sum) * totalMin));
      segments[i].durationMin = scaled;
      allocated += scaled;
    }
  }
}

function estimateGenericMinutes(disciplineKey: DisciplineKey, text: string): number {
  const intervals = parseIntervalBlock(text);
  if (intervals) return intervals.minutes;
  const explicit = text.match(/(\d+)\s*min/i);
  if (explicit) return parseInt(explicit[1], 10);
  if (disciplineKey === "recovery") return 30;
  return 45;
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

  const raw =
    estimatedMinutes * POINTS_PER_MIN[disciplineKey] * zoneMult * testBoost;
  return Math.max(15, Math.round(raw));
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1).replace(/\.0$/, "")} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export const WEEK_COMPLETION_BONUS_RATIO = 0.15;
