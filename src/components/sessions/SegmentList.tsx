import type { SessionSegment } from "@/lib/session-meta";
import { formatDuration } from "@/lib/session-meta";

interface SegmentListProps {
  segments: SessionSegment[];
  title?: string;
}

export function SegmentList({ segments, title }: SegmentListProps) {
  if (segments.length === 0) return null;

  return (
    <div className="space-y-2 pl-6">
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          {title}
        </p>
      )}
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={`${i}-${seg.label}`}
            className="flex gap-2 p-3 rounded-xl glass-card-subtle border border-white/6 items-start"
          >
            <div className="shrink-0 w-12 text-right">
              <span className="text-[10px] font-bold text-indigo-300 tabular-nums leading-tight">
                {seg.durationLabel ?? formatDuration(seg.durationMin)}
              </span>
            </div>
            <div className="min-w-0 flex-1 border-l border-white/10 pl-2.5">
              <p className="text-xs font-semibold text-slate-200">{seg.label}</p>
              {seg.description && seg.description !== seg.label && (
                <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">
                  {seg.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
