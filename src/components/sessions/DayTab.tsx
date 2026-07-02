"use client";

import type { GarminMatch } from "@/hooks/useGarminMatches";
import type { TrainingSession } from "@/types";
import type { DayScheduleSlot } from "@/lib/day-schedule";
import { getDisciplineStyle } from "@/lib/discipline";
import { GlassCard } from "@/components/ui/GlassCard";
import { SportBadge } from "./SportBadge";
import { SessionCard } from "./SessionCard";
import { DayActivityCard, DayScheduleSection } from "./DayActivityCard";
import { DayWeatherBanner } from "@/components/weather/DayWeatherBanner";

interface DayTabProps {
  day: TrainingSession;
  sessions: TrainingSession[];
  schedule: DayScheduleSlot[];
  onNoteChange: (note: string, completed: boolean) => void;
  savedNote?: string;
  savedCompleted?: boolean;
  garminMatch?: GarminMatch;
  bonusCompleted?: Record<string, boolean>;
  onBonusToggle?: (trackingId: string, completed: boolean) => void;
}

export function DayTab({
  day,
  sessions,
  schedule,
  onNoteChange,
  savedNote,
  savedCompleted,
  garminMatch,
  bonusCompleted,
  onBonusToggle,
}: DayTabProps) {
  const style = getDisciplineStyle(day.disciplineKey);

  return (
    <div className="space-y-5">
      <GlassCard variant="strong" className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 font-medium">{day.date}</p>
            <h2 className="text-2xl font-bold text-white mt-0.5">{day.day}</h2>
          </div>
          <SportBadge
            disciplineKey={day.disciplineKey}
            label={day.discipline}
            size="md"
          />
        </div>
        <div className={`mt-4 h-1 rounded-full ${style.bg} border ${style.border}`} />
      </GlassCard>

      <DayWeatherBanner
        disciplineKey={day.disciplineKey}
        dateIso={day.dateIso}
      />

      {schedule.map((slot) => {
        if (slot.id === "seance") {
          return (
            <DayScheduleSection key={slot.id} label={slot.label}>
              {sessions.map((session, index) => (
                <SessionCard
                  key={session.day}
                  session={session}
                  onNoteChange={onNoteChange}
                  initialNote={savedNote}
                  initialCompleted={savedCompleted}
                  garminMatch={garminMatch}
                />
              ))}
            </DayScheduleSection>
          );
        }

        if (slot.activities.length === 0) return null;

        return (
          <DayScheduleSection key={slot.id} label={slot.label}>
            <div className="space-y-2">
              {slot.activities.map((activity, i) => (
                <DayActivityCard
                  key={activity.trackingId ?? i}
                  activity={activity}
                  bonusCompleted={bonusCompleted}
                  onBonusToggle={onBonusToggle}
                />
              ))}
            </div>
          </DayScheduleSection>
        );
      })}
    </div>
  );
}
