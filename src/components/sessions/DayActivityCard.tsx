import type { DayActivity } from "@/lib/day-schedule";
import { bonusPointsForCategory } from "@/lib/bonus-points";
import { formatDuration } from "@/lib/session-meta";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentList } from "./SegmentList";

const CATEGORY_STYLES: Record<
  DayActivity["category"],
  { accent: string; label: string; border: string }
> = {
  stretching: {
    accent: "text-teal-300",
    label: "Étirements",
    border: "border-teal-400/25",
  },
  strength: {
    accent: "text-orange-300",
    label: "Renforcement",
    border: "border-orange-400/25",
  },
  mental: {
    accent: "text-indigo-300",
    label: "Mental",
    border: "border-indigo-400/25",
  },
  supplement: {
    accent: "text-violet-300",
    label: "Compléments",
    border: "border-violet-400/25",
  },
};

interface DayActivityCardProps {
  activity: DayActivity;
  bonusCompleted?: Record<string, boolean>;
  onBonusToggle?: (trackingId: string, completed: boolean) => void;
}

export function DayActivityCard({
  activity,
  bonusCompleted = {},
  onBonusToggle,
}: DayActivityCardProps) {
  const style = CATEGORY_STYLES[activity.category];
  const hasSegments = activity.segments.length > 0;
  const segmentTotal = activity.segments.reduce((s, seg) => s + seg.durationMin, 0);
  const hintTotal = parseDurationHint(activity.duration);
  const displayTotal = hintTotal ?? (segmentTotal > 0 ? segmentTotal : null);
  const points = bonusPointsForCategory(activity.category);
  const activityChecked = Boolean(bonusCompleted[activity.trackingId]);

  return (
    <GlassCard className={`p-4 border-l-2 ${style.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {onBonusToggle && (
            <label className="flex shrink-0 items-center pt-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={activityChecked}
                onChange={(e) =>
                  onBonusToggle(activity.trackingId, e.target.checked)
                }
                className="w-3.5 h-3.5 accent-violet-500 rounded"
                title={`+${points} pts bonus`}
              />
            </label>
          )}
          <div className="min-w-0">
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider ${style.accent}`}
            >
              {style.label}
            </p>
            <h4 className="font-medium text-white text-sm mt-0.5">
              {activity.title}
            </h4>
            {activity.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{activity.subtitle}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {activityChecked && (
            <p className="text-[10px] font-semibold text-violet-300 tabular-nums">
              +{points} bonus
            </p>
          )}
          {hasSegments && displayTotal !== null && displayTotal > 0 && (
            <>
              <p className="text-sm font-bold text-white tabular-nums leading-none">
                {formatDuration(displayTotal)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                {activity.duration ? "prévu" : "total"}
              </p>
            </>
          )}
          {!hasSegments && activity.duration && (
            <span className="text-xs text-slate-500 tabular-nums">
              {activity.duration}
            </span>
          )}
        </div>
      </div>

      {hasSegments ? (
        <SegmentList segments={activity.segments} />
      ) : (
        <p className="text-sm text-slate-400 leading-relaxed pl-6">
          {activity.details}
        </p>
      )}
    </GlassCard>
  );
}

function parseDurationHint(hint?: string): number | null {
  if (!hint) return null;
  const range = hint.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (range) {
    return Math.round((parseInt(range[1], 10) + parseInt(range[2], 10)) / 2);
  }
  const min = hint.match(/(\d+)\s*min/i);
  if (min) return parseInt(min[1], 10);
  return null;
}

interface DayScheduleSectionProps {
  label: string;
  children: React.ReactNode;
}

export function DayScheduleSection({ label, children }: DayScheduleSectionProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 px-1">
        {label}
      </p>
      {children}
    </div>
  );
}
