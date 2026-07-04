interface TestStarProps {
  className?: string;
  title?: string;
}

export function TestStar({
  className = "text-[11px] leading-none",
  title = "Séance test",
}: TestStarProps) {
  return (
    <span
      className={`inline-flex shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)] ${className}`}
      title={title}
      aria-label={title}
    >
      ★
    </span>
  );
}
