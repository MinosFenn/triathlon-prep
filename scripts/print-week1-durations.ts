import { readFileSync } from "fs";
import { enrichSessionMeta } from "../src/lib/session-meta";
import { extractMarkdownTableRows } from "../src/lib/parsers/markdown";
import type { DisciplineKey } from "../src/types";

const DISC: Record<string, DisciplineKey> = {
  Vélo: "bike",
  Course: "run",
  Natation: "swim",
  "Vélo + Brick": "brick",
  Récupération: "recovery",
};

const content = readFileSync("training_semaine1.md", "utf-8");
const rows = extractMarkdownTableRows(content).filter(
  (r) => r[0] && r[0] !== "Jour"
);

for (const [jour, disc, seance, details, zone] of rows) {
  const key = DISC[disc] ?? "recovery";
  const z = zone
    .replace(/Zone\s*/gi, "Z")
    .replace(/–/g, "-")
    .replace(/\s+/g, "");
  const m = enrichSessionMeta(key, seance, details, z);
  console.log(`${jour} | ${seance} => ${m.estimatedMinutes} min`);
}
