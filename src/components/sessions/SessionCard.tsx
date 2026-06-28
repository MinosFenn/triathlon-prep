"use client";

import { useState } from "react";
import type { TrainingSession } from "@/types";
import { getDisciplineStyle } from "@/lib/discipline";
import { formatDuration } from "@/lib/session-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { SportIcon } from "./SportIcon";
import { ZoneBadge } from "./ZoneBadge";
import { SegmentList } from "./SegmentList";

import type { GarminMatch } from "@/hooks/useGarminMatches";

interface SessionCardProps {
  session: TrainingSession;
  onNoteChange: (note: string, completed: boolean) => void;
  initialNote?: string;
  initialCompleted?: boolean;
  garminMatch?: GarminMatch;
}

export function SessionCard({
  session,
  onNoteChange,
  initialNote = "",
  initialCompleted = false,
  garminMatch,
}: SessionCardProps) {
  const style = getDisciplineStyle(session.disciplineKey);
  const isTest = session.notes?.startsWith("TEST:");
  const [note, setNote] = useState(
    initialNote || (isTest ? "" : session.notes || "")
  );
  const [completed, setCompleted] = useState(initialCompleted);
  const isRecovery = session.disciplineKey === "recovery";

  return (
    <GlassCard className="p-5 mb-3">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border ${style.bg} ${style.border}`}>
            <SportIcon disciplineKey={session.disciplineKey} className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wider ${style.color}`}>
              {session.discipline}
            </p>
            <h4 className="font-semibold text-white text-lg leading-tight">
              {session.type}
            </h4>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ZoneBadge zone={session.zone} />
          <div className="text-right">
            <p className="text-lg font-bold text-white tabular-nums leading-none">
              {formatDuration(session.estimatedMinutes)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
              estimé
            </p>
          </div>
        </div>
      </div>

      {session.segments.length > 0 && (
        <div className="mb-4">
          <SegmentList
            segments={session.segments}
            title="Structure de la séance"
          />
        </div>
      )}

      {session.material && (
        <div className="text-sm text-slate-400 mb-4 flex items-start gap-2">
          <span className="text-slate-500 shrink-0 font-medium">Matériel</span>
          <span>{session.material}</span>
        </div>
      )}

      {isTest && (
        <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-400/25 rounded-xl p-3 mb-4">
          {session.notes}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
            Points
          </span>
          <span className="text-sm font-bold text-amber-200 tabular-nums">
            +{session.points} pts
          </span>
          {garminMatch && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/15 border border-emerald-400/25 px-2 py-0.5 rounded-full">
              Garmin · {garminMatch.durationMin} min
              {garminMatch.distanceKm ? ` · ${garminMatch.distanceKm} km` : ""}
            </span>
          )}
        </div>
        {!isRecovery && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => {
                setCompleted(e.target.checked);
                onNoteChange(note, e.target.checked);
              }}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <span className="text-sm font-medium text-slate-200">Validée</span>
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
          Mes ressentis
        </label>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            onNoteChange(e.target.value, completed);
          }}
          placeholder="Fatigue, douleurs, sensations… (ajustements automatiques via IA)"
          className="w-full p-3 rounded-xl text-sm glass-input resize-none"
          rows={2}
        />
      </div>
    </GlassCard>
  );
}
