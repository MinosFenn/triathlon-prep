import type { SessionSegment } from "@/lib/session-meta";
import { formatDuration } from "@/lib/session-meta";
import { bonusPointsForCategory } from "@/lib/bonus-points";
import type { DayActivity } from "@/lib/day-schedule";

interface SegmentListProps {
  segments: SessionSegment[];
  title?: string;
  category?: DayActivity["category"];
  segmentTrackingIds?: string[];
  bonusCompleted?: Record<string, boolean>;
  onBonusToggle?: (trackingId: string, completed: boolean) => void;
}

export function SegmentList({
  segments,
  title,
  category = "stretching",
  segmentTrackingIds = [],
  bonusCompleted = {},
  onBonusToggle,
}: SegmentListProps) {
  if (segments.length === 0) return null;

  const points = bonusPointsForCategory(category);

  return (
    <div className="space-y-2">
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          {title}
        </p>
      )}
      <div className="space-y-1.5">
        {segments.map((seg, i) => {
          const trackingId = segmentTrackingIds[i];
          const checked = trackingId ? Boolean(bonusCompleted[trackingId]) : false;

          return (
            <div
              key={i}
              className="flex gap-2 p-3 rounded-xl glass-card-subtle border border-white/6 items-start"
            >
              {trackingId && onBonusToggle && (
                <label className="flex shrink-0 items-center pt-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onBonusToggle(trackingId, e.target.checked)}
                    className="w-3.5 h-3.5 accent-violet-500 rounded"
                    title={`+${points} pts bonus`}
                  />
                </label>
              )}
              <div className="shrink-0 w-12 text-right">
                <span className="text-[10px] font-bold text-indigo-300 tabular-nums leading-tight">
                  {seg.durationLabel ?? formatDuration(seg.durationMin)}
                </span>
              </div>
              <div className="min-w-0 flex-1 border-l border-white/10 pl-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-200">{seg.label}</p>
                  {checked && (
                    <span className="text-[9px] font-semibold text-violet-300 tabular-nums shrink-0">
                      +{points}
                    </span>
                  )}
                </div>
                {seg.description && seg.description !== seg.label && (
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">
                    {seg.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
