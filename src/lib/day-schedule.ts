import type {
  MentalData,
  StrengthData,
  StrengthSession,
  StretchingData,
  TrainingSession,
} from "@/types";
import type { SessionSegment } from "@/lib/session-meta";
import {
  buildActivityTrackingId,
  buildSegmentTrackingId,
} from "@/lib/bonus-points";
import {
  parseActivitySegments,
  parseStrengthSegments,
} from "@/lib/activity-segments";
import type { DailySupplementEntry } from "@/lib/supplements-daily";
import { SUPPLEMENT_TIMING_LABELS } from "@/lib/supplements-daily";

export type ScheduleSlotId =
  | "reveil"
  | "avant_seance"
  | "seance"
  | "midi"
  | "apres_seance"
  | "renforcement"
  | "soir";

export interface DayActivity {
  category: "stretching" | "strength" | "mental" | "supplement";
  title: string;
  details: string;
  subtitle?: string;
  duration?: string;
  segments: SessionSegment[];
  trackingId: string;
  segmentTrackingIds: string[];
}

export interface DayScheduleSlot {
  id: ScheduleSlotId;
  label: string;
  activities: DayActivity[];
}

const SLOT_LABELS: Record<ScheduleSlotId, string> = {
  reveil: "Réveil",
  avant_seance: "Avant la séance",
  seance: "Séance",
  midi: "Midi",
  apres_seance: "Après la séance",
  renforcement: "Renforcement",
  soir: "Soir / Coucher",
};

function isTrainingDay(session: TrainingSession): boolean {
  return session.disciplineKey !== "recovery";
}

function findRoutine(stretching: StretchingData, moment: string) {
  return stretching.routine.find((r) =>
    r.moment.toLowerCase().includes(moment.toLowerCase())
  );
}

function getStrengthForDay(
  strength: StrengthData,
  weekNum: number,
  dayShort: string
): StrengthSession | undefined {
  return strength.sessionsByWeek[weekNum]?.find((s) => s.day === dayShort);
}

function matchesDay(planDay: string, session: TrainingSession): boolean {
  const normalized = planDay.toLowerCase().replace(/\s+/g, "");
  const full = session.day.toLowerCase();
  const short = session.dayShort.toLowerCase();
  return full.startsWith(normalized.slice(0, 3)) || normalized.startsWith(short);
}

function getMentalForDay(mental: MentalData, session: TrainingSession) {
  return mental.weeklyPlan.find((m) => matchesDay(m.day, session));
}

function timingMatches(timing: string | undefined, ...keywords: string[]): boolean {
  if (!timing) return false;
  const t = timing.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

function attachTracking(
  activity: Omit<DayActivity, "trackingId" | "segmentTrackingIds">,
  dayIndex: number,
  slotId: ScheduleSlotId,
  activityIndex: number
): DayActivity {
  const segmentTrackingIds = activity.segments.map((_, si) =>
    buildSegmentTrackingId(dayIndex, slotId, activityIndex, si)
  );
  return {
    ...activity,
    trackingId: buildActivityTrackingId(dayIndex, slotId, activityIndex),
    segmentTrackingIds,
  };
}

function stretchActivity(
  title: string,
  details: string,
  duration: string | undefined,
  dayIndex: number,
  slotId: ScheduleSlotId,
  activityIndex: number
): DayActivity {
  const segments = parseActivitySegments(details, duration);
  return attachTracking(
    {
      category: "stretching",
      title,
      details,
      duration,
      segments,
    },
    dayIndex,
    slotId,
    activityIndex
  );
}

function mentalActivity(
  activity: string,
  timing: string | undefined,
  duration: string | undefined,
  dayIndex: number,
  slotId: ScheduleSlotId,
  activityIndex: number
): DayActivity {
  const segments = parseActivitySegments(activity, duration);
  return attachTracking(
    {
      category: "mental",
      title: activity.includes("+") ? "Préparation mentale" : activity,
      details: activity,
      subtitle: timing,
      duration,
      segments,
    },
    dayIndex,
    slotId,
    activityIndex
  );
}

function strengthActivity(
  session: StrengthSession,
  dayIndex: number,
  slotId: ScheduleSlotId,
  activityIndex: number
): DayActivity {
  const segments = parseStrengthSegments(session.exercises, session.duration);
  return attachTracking(
    {
      category: "strength",
      title: session.type,
      details: session.exercises,
      duration: session.duration,
      segments,
    },
    dayIndex,
    slotId,
    activityIndex
  );
}

function supplementActivity(
  timing: DailySupplementEntry["timing"],
  entries: DailySupplementEntry[],
  dayIndex: number,
  slotId: ScheduleSlotId,
  activityIndex: number
): DayActivity {
  const segments = entries.map((e) => ({
    label: e.name,
    description: e.dose,
    durationMin: 0,
    durationLabel: "—",
  }));

  return attachTracking(
    {
      category: "supplement",
      title: `Compléments — ${SUPPLEMENT_TIMING_LABELS[timing]}`,
      details: entries.map((e) => `${e.name} (${e.dose})`).join(" · "),
      segments,
    },
    dayIndex,
    slotId,
    activityIndex
  );
}

function pushSupplements(
  slots: DayScheduleSlot[],
  slotId: ScheduleSlotId,
  timing: DailySupplementEntry["timing"],
  entries: DailySupplementEntry[],
  dayIndex: number
) {
  const filtered = entries.filter((e) => e.timing === timing);
  if (filtered.length === 0) return;

  let slot = slots.find((s) => s.id === slotId);
  if (!slot) {
    slot = { id: slotId, label: SLOT_LABELS[slotId], activities: [] };
    slots.push(slot);
  }

  slot.activities.push(
    supplementActivity(timing, filtered, dayIndex, slotId, slot.activities.length)
  );
}

function sortSlots(slots: DayScheduleSlot[]): DayScheduleSlot[] {
  const order: ScheduleSlotId[] = [
    "reveil",
    "avant_seance",
    "seance",
    "midi",
    "apres_seance",
    "renforcement",
    "soir",
  ];
  return order
    .map((id) => slots.find((s) => s.id === id))
    .filter((s): s is DayScheduleSlot => Boolean(s));
}

export function buildDaySchedule(
  session: TrainingSession,
  weekNum: number,
  strength: StrengthData,
  stretching: StretchingData,
  mental: MentalData,
  dailySupplements: DailySupplementEntry[] = [],
  dayIndex = 0
): DayScheduleSlot[] {
  const training = isTrainingDay(session);
  const mentalEntry = getMentalForDay(mental, session);
  const strengthEntry = getStrengthForDay(strength, weekNum, session.dayShort);

  const matinRoutine = findRoutine(stretching, "matin");
  const postRoutine = findRoutine(stretching, "post");
  const soirRoutine = findRoutine(stretching, "soir");

  const slots: DayScheduleSlot[] = [];

  const reveilActivities: DayActivity[] = [];
  if (matinRoutine) {
    reveilActivities.push(
      stretchActivity(
        "Étirements dynamiques + respiration",
        matinRoutine.stretches,
        matinRoutine.duration,
        dayIndex,
        "reveil",
        reveilActivities.length
      )
    );
  }
  if (mentalEntry && timingMatches(mentalEntry.timing, "matin au réveil")) {
    reveilActivities.push(
      mentalActivity(
        mentalEntry.activity,
        mentalEntry.timing,
        mentalEntry.duration,
        dayIndex,
        "reveil",
        reveilActivities.length
      )
    );
  }
  if (reveilActivities.length > 0) {
    slots.push({ id: "reveil", label: SLOT_LABELS.reveil, activities: reveilActivities });
  }
  pushSupplements(slots, "reveil", "matin", dailySupplements, dayIndex);

  if (training) {
    const avantActivities: DayActivity[] = [];
    avantActivities.push(
      stretchActivity(
        "Échauffement dynamique",
        stretching.preWorkout,
        "5–10 min",
        dayIndex,
        "avant_seance",
        avantActivities.length
      )
    );
    if (mentalEntry && timingMatches(mentalEntry.timing, "avant la séance")) {
      avantActivities.push(
        mentalActivity(
          mentalEntry.activity,
          mentalEntry.timing,
          mentalEntry.duration,
          dayIndex,
          "avant_seance",
          avantActivities.length
        )
      );
    }
    slots.push({ id: "avant_seance", label: SLOT_LABELS.avant_seance, activities: avantActivities });
  }

  slots.push({ id: "seance", label: SLOT_LABELS.seance, activities: [] });
  pushSupplements(slots, "midi", "midi", dailySupplements, dayIndex);

  if (training) {
    const apresActivities: DayActivity[] = [];
    if (postRoutine) {
      apresActivities.push(
        stretchActivity(
          "Étirements statiques",
          postRoutine.stretches,
          postRoutine.duration,
          dayIndex,
          "apres_seance",
          apresActivities.length
        )
      );
    } else {
      apresActivities.push(
        stretchActivity(
          "Étirements statiques",
          stretching.postWorkout,
          "10–15 min",
          dayIndex,
          "apres_seance",
          apresActivities.length
        )
      );
    }
    if (mentalEntry && timingMatches(mentalEntry.timing, "après l'entraînement", "apres l'entrainement")) {
      apresActivities.push(
        mentalActivity(
          mentalEntry.activity,
          mentalEntry.timing,
          mentalEntry.duration,
          dayIndex,
          "apres_seance",
          apresActivities.length
        )
      );
    }
    slots.push({ id: "apres_seance", label: SLOT_LABELS.apres_seance, activities: apresActivities });
  }
  pushSupplements(slots, "apres_seance", "post", dailySupplements, dayIndex);

  if (strengthEntry) {
    slots.push({
      id: "renforcement",
      label: SLOT_LABELS.renforcement,
      activities: [
        strengthActivity(strengthEntry, dayIndex, "renforcement", 0),
      ],
    });
  }

  const soirActivities: DayActivity[] = [];
  if (soirRoutine) {
    soirActivities.push(
      stretchActivity(
        "Étirements du soir",
        soirRoutine.stretches,
        soirRoutine.duration,
        dayIndex,
        "soir",
        soirActivities.length
      )
    );
  }
  if (
    mentalEntry &&
    (timingMatches(mentalEntry.timing, "soir", "coucher", "dormir") ||
      timingMatches(mentalEntry.timing, "matin ou soir"))
  ) {
    soirActivities.push(
      mentalActivity(
        mentalEntry.activity,
        mentalEntry.timing,
        mentalEntry.duration,
        dayIndex,
        "soir",
        soirActivities.length
      )
    );
  }
  if (soirActivities.length > 0) {
    slots.push({ id: "soir", label: SLOT_LABELS.soir, activities: soirActivities });
  }
  pushSupplements(slots, "soir", "soir", dailySupplements, dayIndex);

  return sortSlots(slots);
}

export function getStrengthDescription(strength: StrengthData, weekNum: number): string {
  return strength.descriptionsByWeek[weekNum] ?? "";
}
