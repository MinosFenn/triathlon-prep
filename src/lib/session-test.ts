import type { TrainingSession } from "@/types";

/** Détecte un test à partir du titre de séance (markdown « Séance »). */
export function isTestSessionTitle(seance: string): boolean {
  const title = seance.toLowerCase();
  return /test|ftp/.test(title);
}

export function isTestSession(
  session: Pick<TrainingSession, "notes" | "type">
): boolean {
  if (session.notes?.startsWith("TEST:")) return true;
  return isTestSessionTitle(session.type);
}
