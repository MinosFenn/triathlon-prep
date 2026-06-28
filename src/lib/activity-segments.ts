import type { SessionSegment } from "@/lib/session-meta";

/** Parse "+"-separated exercise lists with per-item durations in parentheses. */
export function parseActivitySegments(
  text: string,
  totalDurationHint?: string
): SessionSegment[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const parts = cleaned.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);

  if (parts.length <= 1) {
    const single = parseSinglePart(parts[0] ?? cleaned);
    if (single) return [single];

    const subItems = splitSubList(cleaned);
    if (subItems.length > 1) {
      return subItems.map((item) => ({
        label: item,
        description: item,
        durationMin: 0,
        durationLabel: "—",
      }));
    }
    return [];
  }

  const segments = parts
    .map((part) => parseSinglePart(part))
    .filter((s): s is SessionSegment => s !== null);

  const missingDuration = segments.filter((s) => s.durationMin <= 0);
  if (missingDuration.length > 0 && totalDurationHint) {
    const totalMin = parseTotalMinutes(totalDurationHint);
    if (totalMin > 0) {
      const perItem = Math.max(1, Math.round(totalMin / segments.length));
      for (const seg of segments) {
        if (seg.durationMin <= 0) seg.durationMin = perItem;
      }
    }
  }

  return segments;
}

function parseSinglePart(part: string): SessionSegment | null {
  const dashSplit = part.split(/\s*—\s*/);
  const head = dashSplit[0]?.trim() ?? part;
  const tail = dashSplit.slice(1).join(" — ").trim();

  const parenMatch = head.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const label = parenMatch[1].trim();
    const timing = parenMatch[2].trim();
    const duration = parseTimingToken(timing);
    return {
      label,
      description: tail || describeTiming(timing, label),
      durationMin: duration.minutes,
      durationLabel: duration.label,
    };
  }

  const duration = parseTimingToken(head);
  if (duration.minutes > 0) {
    return {
      label: head.replace(/\([^)]+\)/, "").trim() || head,
      description: tail || head,
      durationMin: duration.minutes,
      durationLabel: duration.label,
    };
  }

  if (tail) {
    return {
      label: head,
      description: tail,
      durationMin: 0,
      durationLabel: undefined,
    };
  }

  return null;
}

function splitSubList(text: string): string[] {
  const afterDash = text.split(/\s*—\s*/);
  if (afterDash.length < 2) return [];
  return afterDash[1]
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTimingToken(token: string): { minutes: number; label?: string } {
  const t = token.toLowerCase();

  const rangeMin = t.match(/(\d+)\s*[–-]\s*(\d+)\s*min/);
  if (rangeMin) {
    const low = parseInt(rangeMin[1], 10);
    const high = parseInt(rangeMin[2], 10);
    const avg = Math.round((low + high) / 2);
    return { minutes: avg, label: `${low}–${high} min` };
  }

  const minMatch = t.match(/(\d+)\s*min/);
  if (minMatch) {
    const m = parseInt(minMatch[1], 10);
    return { minutes: m, label: `${m} min` };
  }

  const secPerLimb = t.match(/(\d+)\s*s(?:ec)?\s*\/?\s*(jambe|bras|côté|cote|pied)/);
  if (secPerLimb) {
    const sec = parseInt(secPerLimb[1], 10);
    const minutes = Math.max(1, Math.round((sec * 2) / 60));
    return { minutes, label: `${secPerLimb[1]}s/${secPerLimb[2]}` };
  }

  const secFixed = t.match(/(\d+)\s*s(?:ec)?(?:\s*\/?\s*côté)?/);
  if (secFixed) {
    const sec = parseInt(secFixed[1], 10);
    const minutes = Math.max(1, Math.round(sec / 60));
    return { minutes, label: `${sec}s` };
  }

  const repsMatch = t.match(/(?:x\s*)?(\d+)\s*(?:x|rép(?:étitions)?)/i) ?? t.match(/x\s*(\d+)/i);
  if (repsMatch) {
    const reps = parseInt(repsMatch[1], 10);
    const minutes = Math.max(1, Math.round((reps * 20) / 60));
    return { minutes, label: `${reps}×` };
  }

  const setsMatch = t.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (setsMatch) {
    const sets = parseInt(setsMatch[1], 10);
    const reps = parseInt(setsMatch[2], 10);
    const minutes = Math.max(2, Math.round((sets * reps * 4) / 60));
    return { minutes, label: `${sets}×${reps}` };
  }

  return { minutes: 0 };
}

function describeTiming(timing: string, label: string): string {
  if (timing.toLowerCase().includes("min")) return label;
  return `${label} — ${timing}`;
}

function parseTotalMinutes(hint: string): number {
  const range = hint.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (range) {
    return Math.round((parseInt(range[1], 10) + parseInt(range[2], 10)) / 2);
  }
  const single = hint.match(/(\d+)/);
  return single ? parseInt(single[1], 10) : 0;
}

export function sumSegmentMinutes(segments: SessionSegment[]): number {
  return segments.reduce((sum, s) => sum + s.durationMin, 0);
}

/** Split comma-separated strength exercises with shared sets prescription. */
export function parseStrengthSegments(
  exercises: string,
  sessionDuration?: string
): SessionSegment[] {
  const [listPart, setsPart] = exercises.split(/\s*—\s*/);
  const items = listPart
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return parseActivitySegments(exercises, sessionDuration);
  }

  const setsLabel = setsPart?.trim();
  const perExerciseMin = setsLabel
    ? Math.max(2, Math.round(parseTotalMinutes(sessionDuration ?? "25 min") / items.length))
    : 4;

  return items.map((name) => ({
    label: name,
    description: setsLabel ?? "",
    durationMin: perExerciseMin,
    durationLabel: setsLabel,
  }));
}
