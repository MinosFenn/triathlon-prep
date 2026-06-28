import type { MealPlate, NutritionData, ShoppingCategory } from "@/types";
import { readContentFile } from "@/lib/content-path";
import {
  extractBulletItems,
  extractMarkdownTableRows,
  extractSection,
} from "@/lib/parsers/markdown";

export function loadNutrition(): NutritionData {
  const content = readContentFile("nutrition.md");

  const rules = extractRules(content);
  const lunchPlates = extractMealPlates(content, "5 Plats pour le Midi");
  const dinnerPlates = extractMealPlates(content, "5 Plats pour le Soir");
  const longWorkoutDay = extractLongWorkoutDay(content);
  const shoppingList = extractShoppingList(content);

  return {
    rules,
    lunchPlates,
    dinnerPlates,
    longWorkoutDay,
    shoppingList,
    intenseDays: {
      lunch: findPlateByWhen(lunchPlates, "intense") ?? "Poulet riz basmati + légumes",
      dinner: findPlateByWhen(dinnerPlates, "intense") ?? "Saumon patate douce + épinards",
    },
    moderateDays: {
      lunch: findPlateByWhen(lunchPlates, "léger") ?? "Omelette patate + salade",
      dinner: findPlateByWhen(dinnerPlates, "intense") ?? "Dinde riz sauvage + légumes",
    },
  };
}

function extractRules(content: string): string[] {
  const section = extractSection(content, "Règles de Base");
  return section
    .split("\n")
    .filter((l) => /^- /.test(l) && !/^  - /.test(l))
    .map((l) =>
      l
        .replace(/^-\s*/, "")
        .replace(/\*\*/g, "")
        .trim()
    )
    .filter(Boolean)
    .filter((rule) => !/^Timing\s*:?\s*$/i.test(rule));
}

function stripEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, "").trim();
}

function extractMealPlates(content: string, sectionTitle: string): MealPlate[] {
  const section = extractSection(content, sectionTitle);
  const rows = extractMarkdownTableRows(section);

  return rows
    .filter((row) => row[0] && !row[0].includes("Nom"))
    .map((row) => ({
      name: row[0].replace(/\*\*/g, "").trim(),
      ingredients: row[1]?.replace(/\*\*/g, "").trim(),
      macros: row[2]?.trim(),
      when: row[4]?.replace(/\*\*/g, "").trim() ?? "",
    }));
}

function findPlateByWhen(plates: MealPlate[], keyword: string): string | undefined {
  const plate = plates.find((p) => p.when.toLowerCase().includes(keyword.toLowerCase()));
  return plate?.name;
}

function extractLongWorkoutDay(content: string): { time: string; food: string }[] {
  const section = extractSection(content, "Jour Type");
  const rows = extractMarkdownTableRows(section);

  return rows
    .filter((row) => row[0] && !row[0].includes("Moment"))
    .map((row) => ({
      time: row[0].replace(/\*\*/g, "").trim(),
      food: row[1]?.replace(/\*\*/g, "").trim() ?? "",
    }));
}

function extractShoppingList(content: string): ShoppingCategory[] {
  const section = extractSection(content, "Liste de Courses");
  const categories: ShoppingCategory[] = [];
  let current: ShoppingCategory | null = null;

  for (const line of section.split("\n")) {
    const catMatch = line.match(/^###\s+\*\*(.+?)\*\*/);
    if (catMatch) {
      if (current) categories.push(current);
      current = { category: stripEmoji(catMatch[1]), items: [] };
      continue;
    }
    if (current && line.trim().startsWith("- ")) {
      const item = line
        .replace(/^- \[ \]\s*/, "")
        .replace(/^-\s*/, "")
        .trim();
      if (item) current.items.push(item);
    }
  }
  if (current) categories.push(current);

  return categories;
}
