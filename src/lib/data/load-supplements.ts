import type { Supplement } from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";

const ALL_SUPPLEMENTS: Record<string, Omit<Supplement, "name">> = {
  Magnésium: {
    dose: "300–400 mg",
    when: "Soir",
    benefits: "Crampes + sommeil",
  },
  Zinc: {
    dose: "15–30 mg",
    when: "Midi",
    benefits: "Immunité + récup",
  },
  "Oméga-3": {
    dose: "1–2 g",
    when: "Midi/Soir",
    benefits: "Anti-inflammatoire",
  },
  Créatine: {
    dose: "5 g",
    when: "Post-entraînement",
    benefits: "Puissance vélo",
  },
  "Vitamine D3 + K2": {
    dose: "1000–2000 UI",
    when: "Matin",
    benefits: "Os + immunité",
  },
};

/** Logique progressive inspirée de vibe_example.py + supplements.md */
export function getSupplementsForWeek(weekNum: number): Supplement[] {
  const schedule = parseProgressiveSchedule();
  const weekEntry = schedule.find((s) => s.week === weekNum);

  if (weekEntry) {
    return weekEntry.supplements;
  }

  // Fallback basé sur vibe_example.py
  if (weekNum === 1) {
    return [makeSupplement("Magnésium", "200 mg")];
  }
  if (weekNum === 2) {
    return [makeSupplement("Magnésium"), makeSupplement("Zinc", "15 mg")];
  }
  if (weekNum <= 4) {
    return [
      makeSupplement("Magnésium"),
      makeSupplement("Zinc"),
      ...(weekNum >= 3 ? [makeSupplement("Oméga-3", "1 g")] : []),
      ...(weekNum >= 4 ? [makeSupplement("Créatine")] : []),
    ];
  }
  if (weekNum <= 8) {
    return [
      makeSupplement("Magnésium"),
      makeSupplement("Zinc"),
      makeSupplement("Oméga-3"),
      makeSupplement("Créatine"),
    ];
  }
  return [
    makeSupplement("Magnésium"),
    makeSupplement("Zinc"),
    makeSupplement("Oméga-3"),
    makeSupplement("Créatine"),
    makeSupplement("Vitamine D3 + K2"),
  ];
}

export function loadAllSupplementsByWeek(): Record<number, Supplement[]> {
  const result: Record<number, Supplement[]> = {};
  for (let w = 1; w <= 13; w++) {
    result[w] = getSupplementsForWeek(w);
  }
  return result;
}

function makeSupplement(name: string, doseOverride?: string): Supplement {
  const base = ALL_SUPPLEMENTS[name];
  return {
    name,
    dose: doseOverride ?? base.dose,
    when: base.when,
    benefits: base.benefits,
  };
}

function parseProgressiveSchedule(): { week: number; supplements: Supplement[] }[] {
  try {
    const content = readContentFile("supplements.md");
    const section = extractSection(content, "Calendrier de Démarrage Progressif");
    const rows = extractMarkdownTableRows(section);

    const accumulated: Supplement[] = [];
    const schedule: { week: number; supplements: Supplement[] }[] = [];

    for (const row of rows) {
      const weekStr = row[0]?.replace(/\*\*/g, "").trim();
      const weekNum = parseInt(weekStr, 10);
      if (isNaN(weekNum)) continue;

      const suppName = row[1]?.replace(/\*\*/g, "").replace(/^\+?\s*/, "").trim();
      const dose = row[2]?.replace(/\*\*/g, "").trim();

      if (suppName.startsWith("+")) {
        const name = normalizeSupplementName(suppName.slice(1).trim());
        if (name) accumulated.push(makeSupplement(name, dose || undefined));
      } else {
        const name = normalizeSupplementName(suppName);
        if (name) {
          const existing = accumulated.findIndex((s) => s.name === name);
          if (existing >= 0) {
            accumulated[existing] = makeSupplement(name, dose || undefined);
          } else {
            accumulated.push(makeSupplement(name, dose || undefined));
          }
        }
      }

      schedule.push({
        week: weekNum,
        supplements: [...accumulated],
      });
    }

    return schedule;
  } catch {
    return [];
  }
}

function normalizeSupplementName(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (lower.includes("magnésium") || lower.includes("magnesium")) return "Magnésium";
  if (lower.includes("zinc")) return "Zinc";
  if (lower.includes("oméga") || lower.includes("omega")) return "Oméga-3";
  if (lower.includes("créatine") || lower.includes("creatine")) return "Créatine";
  if (lower.includes("vitamine d")) return "Vitamine D3 + K2";
  return null;
}
