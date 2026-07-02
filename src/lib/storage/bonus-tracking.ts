const BONUS_PREFIX = "triathlon-bonus-week-";

export type BonusTracking = Record<string, boolean>;

export function getBonusTracking(weekNum: number): BonusTracking {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${BONUS_PREFIX}${weekNum}`);
    return raw ? (JSON.parse(raw) as BonusTracking) : {};
  } catch {
    return {};
  }
}

export function saveBonusTracking(weekNum: number, tracking: BonusTracking): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${BONUS_PREFIX}${weekNum}`, JSON.stringify(tracking));
}

export function getDayBonusTracking(
  weekNum: number,
  dayIndex: number
): BonusTracking {
  const all = getBonusTracking(weekNum);
  const prefix = `w${weekNum}-d${dayIndex}-`;
  const result: BonusTracking = {};
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(prefix) && value) result[key] = true;
  }
  return result;
}
