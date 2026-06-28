import type { MentalData } from "@/types";
import { readContentFile } from "@/lib/content-path";
import { extractMarkdownTableRows, extractSection } from "@/lib/parsers/markdown";

export function loadMental(): MentalData {
  const content = readContentFile("mental.md");

  const techniques = [
    "Respiration 4-7-8",
    "Box breathing",
    "Visualisation course",
    "Méditation",
    "Respiration diaphragmatique",
    "Respiration alternée (Nadi Shodhana)",
  ];

  const section = extractSection(content, "Plan Hebdomadaire de Préparation Mentale");
  const rows = extractMarkdownTableRows(section);

  const weeklyPlan = rows
    .filter((row) => row[0] && !row[0].includes("Jour"))
    .map((row) => ({
      day: row[0].replace(/\*\*/g, "").trim(),
      activity: row[1]?.replace(/\*\*/g, "").trim() ?? "",
      duration: row[2]?.replace(/\*\*/g, "").trim(),
      timing: row[3]?.replace(/\*\*/g, "").trim(),
    }));

  return { techniques, weeklyPlan };
}
