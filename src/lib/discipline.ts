import type { DisciplineKey } from "@/types";

export interface DisciplineStyle {
  label: string;
  shortLabel: string;
  key: DisciplineKey;
  color: string;
  bg: string;
  border: string;
  glow: string;
}

export const DISCIPLINE_STYLES: Record<DisciplineKey, DisciplineStyle> = {
  swim: {
    label: "Natation",
    shortLabel: "Nage",
    key: "swim",
    color: "text-cyan-300",
    bg: "bg-cyan-500/20",
    border: "border-cyan-400/30",
    glow: "shadow-cyan-500/20",
  },
  bike: {
    label: "Vélo",
    shortLabel: "Vélo",
    key: "bike",
    color: "text-orange-300",
    bg: "bg-orange-500/20",
    border: "border-orange-400/30",
    glow: "shadow-orange-500/20",
  },
  run: {
    label: "Course",
    shortLabel: "Course",
    key: "run",
    color: "text-emerald-300",
    bg: "bg-emerald-500/20",
    border: "border-emerald-400/30",
    glow: "shadow-emerald-500/20",
  },
  brick: {
    label: "Brick",
    shortLabel: "Brick",
    key: "brick",
    color: "text-violet-300",
    bg: "bg-violet-500/20",
    border: "border-violet-400/30",
    glow: "shadow-violet-500/20",
  },
  strength: {
    label: "Renforcement",
    shortLabel: "Renfo",
    key: "strength",
    color: "text-rose-300",
    bg: "bg-rose-500/20",
    border: "border-rose-400/30",
    glow: "shadow-rose-500/20",
  },
  recovery: {
    label: "Récupération",
    shortLabel: "Repos",
    key: "recovery",
    color: "text-slate-300",
    bg: "bg-slate-500/20",
    border: "border-slate-400/30",
    glow: "shadow-slate-500/20",
  },
};

const RAW_DISCIPLINE_MAP: Record<string, DisciplineKey> = {
  Vélo: "bike",
  Course: "run",
  Natation: "swim",
  "Vélo + Brick": "brick",
  Récupération: "recovery",
};

export function resolveDiscipline(raw: string): DisciplineStyle {
  if (raw.includes("Brick")) {
    return DISCIPLINE_STYLES.brick;
  }
  const key = RAW_DISCIPLINE_MAP[raw] ?? "recovery";
  return DISCIPLINE_STYLES[key];
}

export const DISCIPLINE_CHART_COLORS: Record<
  "swim" | "bike" | "run" | "brick" | "strength",
  { earned: string; goal: string }
> = {
  swim: { earned: "rgb(6 182 212 / 0.85)", goal: "rgb(6 182 212 / 0.22)" },
  bike: { earned: "rgb(249 115 22 / 0.85)", goal: "rgb(249 115 22 / 0.22)" },
  run: { earned: "rgb(34 197 94 / 0.85)", goal: "rgb(34 197 94 / 0.22)" },
  brick: { earned: "rgb(168 85 247 / 0.85)", goal: "rgb(168 85 247 / 0.22)" },
  strength: { earned: "rgb(244 63 94 / 0.85)", goal: "rgb(244 63 94 / 0.22)" },
};

export const CHART_DISCIPLINES = ["swim", "bike", "run", "brick", "strength"] as const;
export type ChartDisciplineKey = (typeof CHART_DISCIPLINES)[number];

export function getDisciplineStyle(key: DisciplineKey): DisciplineStyle {
  return DISCIPLINE_STYLES[key];
}
