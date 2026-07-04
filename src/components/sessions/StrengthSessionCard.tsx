"use client";

import type { StrengthSession } from "@/types";
import type { SessionSegment } from "@/lib/session-meta";
import { formatDuration } from "@/lib/session-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentList } from "./SegmentList";
import { StrengthIcon } from "./StrengthIcon";

const STRENGTH_STYLE = {
  color: "text-rose-300",
  bg: "bg-rose-500/20",
  border: "border-rose-400/30",
};

interface StrengthSessionCardProps {
  session: StrengthSession;
  segments: SessionSegment[];
  trackingId: string;
  completed?: boolean;
  onToggle?: (trackingId: string, completed: boolean) => void;
}

export function StrengthSessionCard({
  session,
  segments,
  trackingId,
  completed = false,
  onToggle,
}: StrengthSessionCardProps) {
  const segmentTotal = segments.reduce((s, seg) => s + seg.durationMin, 0);
  const estimatedMinutes =
    session.estimatedMinutes ||
    (segmentTotal > 0 ? segmentTotal : 25);

  return (
    <GlassCard className="p-5 mb-3">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl border ${STRENGTH_STYLE.bg} ${STRENGTH_STYLE.border}`}
          >
            <StrengthIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${STRENGTH_STYLE.color}`}
            >
              Renforcement
            </p>
            <h4 className="font-semibold text-white text-lg leading-tight">
              {session.type}
            </h4>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-300/80 bg-rose-500/15 border border-rose-400/25 px-2 py-0.5 rounded-full">
            Muscu
          </span>
          <div className="text-right">
            <p className="text-lg font-bold text-white tabular-nums leading-none">
              {formatDuration(estimatedMinutes)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
              estimé
            </p>
          </div>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="mb-4">
          <SegmentList segments={segments} title="Exercices" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
            Points
          </span>
          <span className="text-sm font-bold text-amber-200 tabular-nums">
            +{session.points} pts
          </span>
        </div>
        {onToggle && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => onToggle(trackingId, e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded"
            />
            <span className="text-sm font-medium text-slate-200">Validée</span>
          </label>
        )}
      </div>
    </GlassCard>
  );
}
