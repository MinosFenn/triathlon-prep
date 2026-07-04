import type {
  CalendarEntry,
  DisciplineKey,
  PlanEvent,
  PlanTest,
  TrainingSession,
  TriathlonPlan,
  WeekPlan,
  WeekVolume,
} from "@/types";
import { readContentFile } from "@/lib/content-path";
import { resolveDiscipline } from "@/lib/discipline";
import { isTestSessionTitle } from "@/lib/session-test";
import { enrichSessionMeta } from "@/lib/session-meta";
import {
  extractMarkdownTableRows,
  extractProfileField,
  parseCsv,
} from "@/lib/parsers/markdown";

const DAY_SHORT: Record<string, string> = {
  Lundi: "Lun",
  Mardi: "Mar",
  Mercredi: "Mer",
  Jeudi: "Jeu",
  Vendredi: "Ven",
  Samedi: "Sam",
  Dimanche: "Dim",
};

const DAY_ORDER = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function formatVolumeSummary(volume: WeekVolume): string {
  const nat = volume.natation.split(" ")[0];
  const vel = volume.velo.split(" ")[0];
  const cou = volume.course.split(" ")[0];
  const bri = volume.brick.split(" ")[0];
  return `Natation: ${nat} | Vélo: ${vel} | Course: ${cou} | Brick: ${bri}`;
}

function enrichWeek(
  week: WeekPlan,
  tests: PlanTest[],
  events: PlanEvent[]
): WeekPlan {
  const weekTests = tests
    .filter((t) => t.semaine === week.num)
    .map((t) => {
      const parts = t.date.split("/");
      return `${t.type} (${parts[0]}/${parts[1]})`;
    });

  const weekEvents = events
    .filter((e) => getWeekForEvent(e) === week.num)
    .map((e) => formatEventLabel(e));

  return {
    ...week,
    tests: weekTests.length ? weekTests : undefined,
    events: weekEvents.length ? weekEvents : undefined,
  };
}

function getWeekForEvent(event: PlanEvent): number | null {
  const eventMap: Record<string, number> = {
    mariage: 8,
    vacances: 9,
    "Jeûne Genevois": 12,
    race_day: 13,
  };
  return eventMap[event.type] ?? null;
}

function formatEventLabel(event: PlanEvent): string {
  const labels: Record<string, string> = {
    mariage: "Mariage samedi 22/08 → pas de séance ce jour-là",
    vacances: "Vacances 24–30/08 → séances légères",
    "Jeûne Genevois": "Jeûne Genevois (14/09) → taper strict, hydratation",
    race_day: "RACE DAY dimanche 27/09/2026",
  };
  return labels[event.type] ?? `${event.type} (${event.date}) → ${event.adaptation}`;
}

export function loadTriathlonPlan(): TriathlonPlan {
  const raw = JSON.parse(readContentFile("triathlon_12week_plan.json")) as {
    plan: {
      objectif: string;
      duree_totale: string;
      contraintes: { evenements: PlanEvent[] };
      semaines: Array<{
        num: number;
        date_debut: string;
        date_fin: string;
        objectif: string;
        volume: WeekVolume;
        focus: string[];
      }>;
      tests: PlanTest[];
    };
  };

  const globalMd = readContentFile("global_information.md");

  const weeks: WeekPlan[] = raw.plan.semaines.map((s) => {
    const week: WeekPlan = {
      num: s.num,
      dateDebut: s.date_debut,
      dateFin: s.date_fin,
      dates: `${s.date_debut.replace("/2026", "")} – ${s.date_fin}`,
      objective: s.objectif,
      volume: {
        natation: s.volume.natation,
        velo: s.volume.velo,
        course: s.volume.course,
        brick: s.volume.brick,
      },
      volumeSummary: formatVolumeSummary(s.volume),
      focus: s.focus,
    };
    return enrichWeek(week, raw.plan.tests, raw.plan.contraintes.evenements);
  });

  return {
    objectif: raw.plan.objectif,
    dureeTotale: raw.plan.duree_totale,
    athlete: {
      prenom: extractProfileField(globalMd, "Prénom") || "Simon",
      poids: extractProfileField(globalMd, "Poids") || "72 kg",
      taille: extractProfileField(globalMd, "Taille") || "183 cm",
      entrainement: extractProfileField(globalMd, "Entraînement") || "5×/semaine",
      pointFaible: extractProfileField(globalMd, "Point faible") || "Mollet droit",
      raceName: extractProfileField(globalMd, "Épreuve") || "M-Olympia Triathlon",
      raceDate: extractProfileField(globalMd, "Date course") || "27/09/2026",
      raceGoal: extractProfileField(globalMd, "Objectif temps") || "2h30 – 3h00",
    },
    weeks,
    tests: raw.plan.tests,
    events: raw.plan.contraintes.evenements,
  };
}

export function loadWeekSessions(weekNum: number): TrainingSession[] {
  const filename = `training_semaine${weekNum}.md`;

  try {
    const content = readContentFile(filename);
    return parseTrainingWeekMarkdown(content);
  } catch {
    return generateFallbackSessions(weekNum);
  }
}

export function loadAllSessions(): Record<number, TrainingSession[]> {
  const plan = loadTriathlonPlan();
  const sessions: Record<number, TrainingSession[]> = {};

  for (const week of plan.weeks) {
    const raw = loadWeekSessions(week.num);
    sessions[week.num] = enrichSessionsWithDates(raw, week);
  }
  return sessions;
}

function parseTrainingWeekMarkdown(content: string): TrainingSession[] {
  const rows = extractMarkdownTableRows(content);

  return rows
    .filter((row) => row[0] && row[0] !== "Jour")
    .map((row) => {
      const jour = row[0];
      const disciplineRaw = row[1];
      const seance = row[2];
      const hasLocation = row.length >= 7;
      const location = hasLocation ? (row[3] ?? "") : "";
      const details = hasLocation ? row[4] : row[3];
      const zone = hasLocation ? row[5] : row[4];
      const materiel = hasLocation ? row[6] : row[5];
      const style = resolveDiscipline(disciplineRaw);

      const isTest = isTestSessionTitle(seance);

      const normalizedZone = normalizeZone(zone);
      const meta = enrichSessionMeta(style.key, seance, details, normalizedZone);

      return {
        day: jour,
        dayShort: DAY_SHORT[jour] ?? jour.slice(0, 3),
        date: "",
        dateIso: "",
        discipline: style.label,
        disciplineKey: style.key,
        type: seance,
        details,
        zone: normalizedZone,
        material: materiel === "-" ? "" : materiel,
        location: location === "-" ? "" : location,
        notes: isTest ? `TEST: ${details}` : "",
        segments: meta.segments,
        estimatedMinutes: meta.estimatedMinutes,
        points: meta.points,
      };
    });
}

function normalizeZone(zone: string): string {
  if (zone === "-") return "-";
  return zone
    .replace(/Zone\s*/gi, "Z")
    .replace(/–/g, "-")
    .replace(/\s+/g, "")
    .replace(/Racepace/i, "Race")
    .replace(/Race/gi, "Race");
}

function generateFallbackSessions(weekNum: number): TrainingSession[] {
  const plan = loadTriathlonPlan();
  const week = plan.weeks.find((w) => w.num === weekNum);
  if (!week) return [];

  const days = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  if (weekNum === 13) {
    const raceWeek: Partial<TrainingSession>[] = [
      {
        discipline: "Natation",
        disciplineKey: "swim",
        type: "Activation",
        details: "500m technique facile",
        zone: "Z1",
      },
      {
        discipline: "Vélo",
        disciplineKey: "bike",
        type: "Activation",
        details: "15 km facile",
        zone: "Z1",
      },
      {
        discipline: "Récupération",
        disciplineKey: "recovery",
        type: "Repos",
        details: "Repos complet + visualisation",
        zone: "-",
      },
      {
        discipline: "Vélo",
        disciplineKey: "bike",
        type: "Activation",
        details: "10 km avec 3×1min accélération",
        zone: "Z2",
      },
      {
        discipline: "Natation",
        disciplineKey: "swim",
        type: "Repos",
        details: "Repos",
        zone: "-",
      },
      {
        discipline: "Course",
        disciplineKey: "run",
        type: "Activation",
        details: "5 km easy + 4×100m strides",
        zone: "Z2",
      },
      {
        discipline: "Course",
        disciplineKey: "run",
        type: "RACE DAY",
        details: "M-Olympia Triathlon — Objectif 2h30–3h00",
        zone: "Race",
      },
    ];

    return days.map((day, i) => {
      const partial = raceWeek[i];
      const key = partial?.disciplineKey ?? "recovery";
      const type = partial?.type ?? "Repos";
      const details = partial?.details ?? week.objective;
      const zone = partial?.zone ?? "-";
      const meta = enrichSessionMeta(key, type, details, zone);
      return {
        day,
        dayShort: DAY_SHORT[day],
        date: "",
        dateIso: "",
        discipline: partial?.discipline ?? "Récupération",
        disciplineKey: key,
        type,
        details,
        zone,
        material: "",
        location: "",
        notes: i === 6 ? "Arriver 1h avant. Échauffement complet." : "",
        segments: meta.segments,
        estimatedMinutes: meta.estimatedMinutes,
        points: meta.points,
      };
    });
  }

  return days.map((day) => {
    const type = "Consulte training_semaine" + weekNum + ".md";
    const details = week.objective;
    const meta = enrichSessionMeta("recovery", type, details, "-");
    return {
      day,
      dayShort: DAY_SHORT[day],
      date: "",
      dateIso: "",
      discipline: "Récupération",
      disciplineKey: "recovery" as DisciplineKey,
      type,
      details,
      zone: "-",
      material: "",
      location: "",
      notes: "",
      segments: meta.segments,
      estimatedMinutes: meta.estimatedMinutes,
      points: meta.points,
    };
  });
}

export function loadCalendar(): CalendarEntry[] {
  const rows = parseCsv(readContentFile("test.csv"));
  const [, ...dataRows] = rows;

  return dataRows.map((row) => ({
    type: row[0] as "Test" | "Échéance",
    name: row[1],
    date: row[2],
    week: row[3] === "-" ? null : parseInt(row[3], 10),
    discipline: row[4],
    description: row[5],
    objective: row[6],
    material: row[7],
    notes: row[8] ?? "",
  }));
}

export function getTipsForWeek(weekNum: number): string[] {
  if (weekNum <= 3) {
    return [
      "Construis ta base aérobie sans forcer. Cette semaine est dédiée à l'adaptation.",
      "Augmente légèrement tes glucides les jours de vélo pour soutenir l'endurance.",
      "Note tes sensations au mollet droit après chaque séance vélo.",
      "Vérifie ton Garmin Edge et tes bidons avant la sortie longue.",
    ];
  }
  if (weekNum <= 7) {
    return [
      "Focus sur l'intensité et le volume. C'est la phase de construction.",
      "Hydratation renforcée : 500ml/h pendant les longues séances.",
      "Dors 8–9h/nuit en période de charge.",
      "Écoute ton corps et ajuste si nécessaire.",
    ];
  }
  if (weekNum <= 10) {
    return [
      "Reprise progressive après la période de récupération.",
      "Focus sur la qualité des séances plutôt que le volume.",
      "Visualise la course régulièrement.",
      "Teste ta nutrition pendant les longues sorties.",
    ];
  }
  return [
    "Phase d'affûtage : réduis le volume, garde l'intensité.",
    "Priorité à la récupération et à la préparation mentale.",
    "Hydratation et nutrition optimales.",
    "Visualise chaque détail de la course.",
  ];
}

export function enrichSessionsWithDates(
  sessions: TrainingSession[],
  week: WeekPlan
): TrainingSession[] {
  const startParts = week.dateDebut.split("/");
  if (startParts.length < 3) return sessions;

  const [d, m, y] = startParts.map(Number);
  const startDate = new Date(y, m - 1, d);
  const dayOffset: Record<string, number> = Object.fromEntries(
    DAY_ORDER.map((day, index) => [day, index])
  );

  return sessions.map((session) => {
    const offset = dayOffset[session.day] ?? 0;
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + offset);
    const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    const dateIso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { ...session, date: dateStr, dateIso };
  });
}
