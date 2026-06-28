interface ZoneBadgeProps {
  zone: string;
  size?: "small" | "large";
}

const COLORS: Record<string, string> = {
  Z1: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  Z2: "bg-emerald-500/25 text-emerald-200 border-emerald-400/35",
  "Z2-3": "bg-teal-500/20 text-teal-300 border-teal-400/30",
  "Z2-4": "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  Z3: "bg-yellow-500/25 text-yellow-200 border-yellow-400/35",
  "Z3-4": "bg-orange-500/20 text-orange-300 border-orange-400/30",
  Z4: "bg-orange-500/25 text-orange-200 border-orange-400/35",
  Z5: "bg-red-500/25 text-red-300 border-red-400/35",
  Race: "bg-violet-500/25 text-violet-200 border-violet-400/35",
  "Race pace": "bg-violet-500/25 text-violet-200 border-violet-400/35",
};

export function ZoneBadge({ zone, size = "small" }: ZoneBadgeProps) {
  const color = COLORS[zone] ?? "bg-white/10 text-slate-300 border-white/15";
  const sizeClass = size === "large" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`rounded-full font-semibold border backdrop-blur-sm shrink-0 ${color} ${sizeClass}`}
    >
      {zone}
    </span>
  );
}
