/** Parse une ligne de tableau markdown (| col1 | col2 | ...) */
export function parseMarkdownTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1);
}

export function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

/** Extrait les lignes de données d'un tableau markdown (sans la ligne d'en-tête) */
export function extractMarkdownTableRows(content: string): string[][] {
  const lines = content.split("\n");
  const rows: string[][] = [];
  let pastSeparator = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (pastSeparator && rows.length > 0) break;
      continue;
    }
    if (isTableSeparator(trimmed)) {
      pastSeparator = true;
      continue;
    }
    if (pastSeparator) {
      rows.push(parseMarkdownTableRow(trimmed));
    }
  }

  return rows;
}

/** Extrait les items de liste markdown (- item ou - [ ] item) */
export function extractBulletItems(content: string, section?: RegExp): string[] {
  let text = content;
  if (section) {
    const match = content.match(section);
    if (!match) return [];
    text = match[1];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) =>
      line
        .replace(/^- \[ \]\s*/, "")
        .replace(/^- \*\*(.+?)\*\*.*$/, "$1")
        .replace(/^-\s*/, "")
        .replace(/\*\*/g, "")
        .trim()
    )
    .filter(Boolean);
}

/** Extrait le contenu d'une section ## heading */
export function extractSection(content: string, heading: string): string {
  const regex = new RegExp(
    `##\\s*\\*\\*[^*]*${heading}[^*]*\\*\\*[\\s\\S]*?(?=\\n##\\s|$)`,
    "i"
  );
  const match = content.match(regex);
  if (match) return match[0];

  const simpleRegex = new RegExp(
    `##\\s+[^\\n]*${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    "i"
  );
  const simpleMatch = content.match(simpleRegex);
  return simpleMatch ? simpleMatch[0] : "";
}

/** Parse une ligne CSV simple (gère les guillemets basiques) */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(content: string): string[][] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseCsvLine);
}

/** Extrait une valeur de tableau markdown dans global_information.md */
export function extractProfileField(content: string, field: string): string {
  const regex = new RegExp(`\\*\\*${field}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}
