interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong" | "subtle";
}

const VARIANTS = {
  default: "glass-card",
  strong: "glass-card-strong",
  subtle: "glass-card-subtle",
};

export function GlassCard({ children, className = "", variant = "default" }: GlassCardProps) {
  return (
    <div className={`${VARIANTS[variant]} rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
