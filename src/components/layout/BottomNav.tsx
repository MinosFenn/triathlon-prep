"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Plan", icon: PlanIcon },
  { href: "/statistiques", label: "Stats", icon: StatsIcon },
  { href: "/parametres", label: "Garmin", icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-header sticky bottom-0 z-50 border-t border-white/8">
      <div className="max-w-2xl mx-auto px-6 py-2 flex justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-6 rounded-xl transition-colors ${
                active ? "text-indigo-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon active={active} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-indigo-400" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-indigo-400" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 ${active ? "text-indigo-400" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
