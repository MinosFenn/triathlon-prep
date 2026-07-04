interface StrengthIconProps {
  className?: string;
}

export function StrengthIcon({ className = "w-5 h-5" }: StrengthIconProps) {
  return (
    <svg
      className={`${className} text-rose-300`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 6.5 3 10v4l3.5 3.5" />
      <path d="M17.5 6.5 21 10v4l-3.5 3.5" />
      <path d="M6.5 17.5 10 21h4l3.5-3.5" />
      <path d="M6.5 6.5 10 3h4l3.5 3.5" />
      <path d="M9 12h6" />
    </svg>
  );
}
