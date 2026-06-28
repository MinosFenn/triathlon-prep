export type SupplementTiming = "matin" | "midi" | "soir" | "post";

export interface DailySupplementEntry {
  timing: SupplementTiming;
  name: string;
  dose: string;
}

export const SUPPLEMENT_TIMING_LABELS: Record<SupplementTiming, string> = {
  matin: "Matin",
  midi: "Midi",
  soir: "Soir",
  post: "Post-séance",
};

export type DailySupplementsByWeek = Record<
  number,
  Record<string, DailySupplementEntry[]>
>;
