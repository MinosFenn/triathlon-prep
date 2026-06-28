import type { NutritionData, WeekPlan } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { Collapsible } from "@/components/ui/Collapsible";
import { OverviewSection } from "./OverviewSection";

interface OverviewTabProps {
  week: WeekPlan;
  weekNum: number;
  nutrition: NutritionData;
  tips: string[];
}

export function OverviewTab({
  week,
  weekNum,
  nutrition,
  tips,
}: OverviewTabProps) {
  const shoppingItemCount = nutrition.shoppingList.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  return (
    <div className="space-y-4">
      <GlassCard variant="strong" className="p-5 mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">
          Semaine {weekNum}
        </p>
        <h2 className="text-xl font-bold text-white">{week.dates}</h2>
        <p className="mt-2 font-medium text-slate-200">{week.objective}</p>
        <p className="text-sm text-slate-400 mt-2">{week.volumeSummary}</p>

        {week.focus.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {week.focus.map((f, i) => (
              <span
                key={i}
                className="text-xs bg-white/8 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {week.tests && (
          <div className="mt-4 flex flex-wrap gap-2">
            {week.tests.map((test, i) => (
              <span
                key={i}
                className="bg-red-500/15 border border-red-400/30 text-red-300 px-3 py-1 rounded-full text-xs font-semibold"
              >
                Test — {test}
              </span>
            ))}
          </div>
        )}

        {week.events && (
          <div className="mt-2 flex flex-wrap gap-2">
            {week.events.map((event, i) => (
              <span
                key={i}
                className="bg-amber-500/15 border border-amber-400/30 text-amber-200 px-3 py-1 rounded-full text-xs font-medium"
              >
                {event}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      <p className="text-xs text-slate-500 px-1">
        Étirements, mental, compléments et renforcement sont sur chaque jour —
        coche les cases pour gagner des points bonus.
      </p>

      <OverviewSection title="Conseils" accent="from-amber-500/50 to-yellow-500/50">
        <div className="space-y-2 text-sm text-slate-400">
          {tips.map((tip, i) => (
            <p key={i} className="p-3 glass-card-subtle rounded-xl leading-relaxed">
              {tip}
            </p>
          ))}
        </div>
      </OverviewSection>

      <OverviewSection title="Nutrition" accent="from-emerald-500/50 to-teal-500/50">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {nutrition.rules.map((rule, i) => (
              <div
                key={i}
                className="bg-emerald-500/10 border border-emerald-400/20 p-2.5 rounded-xl text-emerald-200"
              >
                {rule}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/8">
            <h4 className="font-medium text-slate-300 mb-2 text-sm">Repas par type de jour</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div>
                <p className="font-medium text-cyan-300">Jours intenses (Lun, Jeu, Sam)</p>
                <p>Déjeuner: {nutrition.intenseDays.lunch}</p>
                <p>Dîner: {nutrition.intenseDays.dinner}</p>
              </div>
              <div>
                <p className="font-medium text-cyan-300">Jours modérés</p>
                <p>Déjeuner: {nutrition.moderateDays.lunch}</p>
                <p>Dîner: {nutrition.moderateDays.dinner}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/8">
            <h4 className="font-medium text-slate-300 mb-2 text-sm">Jour de sortie longue</h4>
            {nutrition.longWorkoutDay.map((item, i) => (
              <p key={i} className="text-sm text-slate-400">
                <span className="text-slate-300 font-medium">{item.time}:</span> {item.food}
              </p>
            ))}
          </div>

          <Collapsible
            title="Suggestion courses"
            subtitle={`${shoppingItemCount} articles · base hebdomadaire`}
          >
            <div className="pt-3 space-y-3">
              {nutrition.shoppingList.map((cat, i) => (
                <div key={i}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    {cat.category}
                  </p>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    {cat.items.map((item, j) => (
                      <label
                        key={j}
                        className="flex items-center glass-card-subtle p-2 rounded-lg text-slate-400"
                      >
                        <input type="checkbox" className="mr-2 accent-emerald-500" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>
      </OverviewSection>
    </div>
  );
}
