interface OverviewSectionProps {
  title: string;
  accent?: string;
  children: React.ReactNode;
}

export function OverviewSection({
  title,
  accent = "from-indigo-500/40 to-cyan-500/40",
  children,
}: OverviewSectionProps) {
  return (
    <div className="glass-card rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${accent}`} />
        <h3 className="font-semibold text-white text-base tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}
