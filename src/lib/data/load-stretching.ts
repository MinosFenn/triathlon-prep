import type { StretchingData } from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";

export function loadStretching(): StretchingData {
  const content = readContentFile("stretching.md");

  const daily = [
    "Mollets: 30s/jambe (excentrique)",
    "Ischios: 30s/jambe",
    "Quads: 30s/jambe",
    "Hanches/Dos: 30s/côté",
    "Épaules: 30s",
  ];

  const routineSection = extractSection(content, "Routine Quotidienne Recommandée");
  const routineRows = extractMarkdownTableRows(routineSection);

  const routine = routineRows
    .filter((row) => row[0] && !row[0].includes("Moment"))
    .map((row) => ({
      moment: row[0].replace(/\*\*/g, "").trim(),
      stretches: row[1]?.trim() ?? "",
      duration: row[2]?.trim() ?? "",
    }));

  return {
    daily,
    preWorkout: "Dynamiques (5–10 min) — cercles de bras, fentes marchées, squats dynamiques",
    postWorkout: "Statiques (30–45s/muscle) — mollets, ischios, quads, dos",
    routine,
  };
}
