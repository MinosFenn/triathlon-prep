import type { DisciplineKey } from "@/types";
import { getDisciplineStyle } from "@/lib/discipline";

interface SportIconProps {
  disciplineKey: DisciplineKey;
  className?: string;
}

export function SportIcon({ disciplineKey, className = "w-5 h-5" }: SportIconProps) {
  const style = getDisciplineStyle(disciplineKey);

  switch (disciplineKey) {
    case "swim":
      return (
        <svg className={`${className} ${style.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
          <path d="M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
          <circle cx="7" cy="8" r="2" />
        </svg>
      );
    case "bike":
      return (
        <svg className={`${className} ${style.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M9 17.5h6M12 6l3 5.5M12 6L9 11.5M12 6h4l-1 5.5" />
        </svg>
      );
    case "run":
      return (
        <svg className={`${className} ${style.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="14" cy="4" r="2" />
          <path d="M11 22l1-7-3-2 4-8 5 3-2 6" />
        </svg>
      );
    case "brick":
      return (
        <svg className={`${className} ${style.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="18" r="3" />
          <circle cx="19" cy="18" r="3" />
          <path d="M8 18h8M12 5v8M10 7l2-2 2 2" />
        </svg>
      );
    default:
      return (
        <svg className={`${className} ${style.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
  }
}
