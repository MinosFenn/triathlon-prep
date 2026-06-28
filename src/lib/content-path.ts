import fs from "fs";
import path from "path";

/** Racine du projet — fichiers markdown/json/csv à la racine */
export const CONTENT_DIR = process.cwd();

export function contentPath(...segments: string[]): string {
  return path.join(CONTENT_DIR, ...segments);
}

export function readContentFile(filename: string): string {
  return fs.readFileSync(contentPath(filename), "utf-8");
}
