import type { DisciplineKey } from "@/types";
import { getDisciplineStyle } from "@/lib/discipline";
import { SportIcon } from "./SportIcon";

interface SportBadgeProps {
  disciplineKey: DisciplineKey;
  label: string;
  size?: "sm" | "md";
}

export function SportBadge({ disciplineKey, label, size = "sm" }: SportBadgeProps) {
  const style = getDisciplineStyle(disciplineKey);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-3 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border backdrop-blur-sm ${style.bg} ${style.border} ${style.color} ${sizeClasses}`}
    >
      <SportIcon disciplineKey={disciplineKey} className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
}
