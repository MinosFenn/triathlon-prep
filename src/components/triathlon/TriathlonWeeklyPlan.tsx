"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, DayTabId, WeekPlan } from "@/types";
import { getDisciplineStyle } from "@/lib/discipline";
import { buildDaySchedule } from "@/lib/day-schedule";
import { filterBonusTrackingForDay } from "@/lib/bonus-points";
import {
  getBonusTracking,
  saveBonusTracking,
  type BonusTracking,
} from "@/lib/storage/bonus-tracking";
import {
  applyGarminMatchesToNotes,
  useGarminMatches,
} from "@/hooks/useGarminMatches";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { DayTab } from "@/components/sessions/DayTab";
import { SportIcon } from "@/components/sessions/SportIcon";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  getSavedCurrentWeek,
  getWeekTracking,
  saveCurrentWeek,
  saveWeekTracking,
} from "@/lib/storage/tracking";

const DAY_TAB_IDS: DayTabId[] = [
  "overview",
  "lun",
  "mar",
  "mer",
  "jeu",
  "ven",
  "sam",
  "dim",
];

interface TriathlonWeeklyPlanProps {
  data: AppData;
}

export function TriathlonWeeklyPlan({ data }: TriathlonWeeklyPlanProps) {
  const [activeTab, setActiveTab] = useState<DayTabId>("overview");
  const [currentWeek, setCurrentWeek] = useState(1);
  const [notes, setNotes] = useState<
    Record<string, { note: string; completed?: boolean }>
  >({});
  const [bonusTracking, setBonusTracking] = useState<BonusTracking>({});

  const {
    plan,
    sessionsByWeek,
    nutrition,
    dailySupplementsByWeek,
    strength,
    stretching,
    mental,
    tipsByWeek,
  } = data;

  const sessions = sessionsByWeek[currentWeek] ?? [];
  const week: WeekPlan =
    plan.weeks.find((w) => w.num === currentWeek) ?? plan.weeks[0];

  const { matches, isGarminMatched, connected: garminConnected } = useGarminMatches();
  const initializedRef = useRef(false);
  const prevWeekRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const skipNextBonusSaveRef = useRef(false);
  const skipNextNotesSaveRef = useRef(false);

  // Restore week + validations once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const week = getSavedCurrentWeek(1);
    prevWeekRef.current = week;
    skipNextBonusSaveRef.current = true;
    skipNextNotesSaveRef.current = true;
    setCurrentWeek(week);
    setNotes(getWeekTracking(week));
    setBonusTracking(getBonusTracking(week));
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    saveCurrentWeek(currentWeek);
  }, [currentWeek]);

  // Load when user switches week
  useEffect(() => {
    if (!initializedRef.current) return;
    if (prevWeekRef.current === currentWeek) return;

    prevWeekRef.current = currentWeek;
    skipNextBonusSaveRef.current = true;
    skipNextNotesSaveRef.current = true;
    setNotes(getWeekTracking(currentWeek));
    setBonusTracking(getBonusTracking(currentWeek));
  }, [currentWeek]);

  // Apply Garmin auto-validation after load
  useEffect(() => {
    if (!hydratedRef.current || matches.length === 0) return;
    setNotes((prev) =>
      applyGarminMatchesToNotes(currentWeek, prev, matches)
    );
  }, [currentWeek, matches]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipNextBonusSaveRef.current) {
      skipNextBonusSaveRef.current = false;
      return;
    }
    saveBonusTracking(currentWeek, bonusTracking);
    window.dispatchEvent(new Event("triathlon-tracking-update"));
  }, [bonusTracking, currentWeek]);

  const handleBonusToggle = useCallback(
    (trackingId: string, completed: boolean) => {
      setBonusTracking((prev) => {
        const next = { ...prev };
        if (completed) next[trackingId] = true;
        else delete next[trackingId];
        return next;
      });
    },
    []
  );

  // Persist validations — only after hydration (never overwrite with {})
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipNextNotesSaveRef.current) {
      skipNextNotesSaveRef.current = false;
      return;
    }
    saveWeekTracking(currentWeek, notes);
    window.dispatchEvent(new Event("triathlon-tracking-update"));
  }, [notes, currentWeek]);

  const handleNoteChange = useCallback(
    (dayIndex: number, noteText: string, completed: boolean) => {
      setNotes((prev) => ({
        ...prev,
        [`day-${dayIndex}`]: { note: noteText, completed },
      }));
    },
    []
  );

  const dayTabs = [
    { id: "overview" as DayTabId, label: "Vue", date: "", sport: null as null },
    ...sessions.map((s, i) => ({
      id: DAY_TAB_IDS[i + 1],
      label: s.dayShort,
      date: s.date,
      sport: s,
    })),
  ];

  function renderTabContent(tabId: DayTabId) {
    if (tabId === "overview") {
      return (
        <OverviewTab
          week={week}
          weekNum={currentWeek}
          nutrition={nutrition}
          tips={tipsByWeek[currentWeek] ?? []}
        />
      );
    }

    const dayIndex = DAY_TAB_IDS.indexOf(tabId) - 1;
    const session = sessions[dayIndex];
    if (!session) return null;

    const saved = notes[`day-${dayIndex}`];
    const dailySupplements =
      dailySupplementsByWeek[currentWeek]?.[session.day] ?? [];
    const schedule = buildDaySchedule(
      session,
      currentWeek,
      strength,
      stretching,
      mental,
      dailySupplements,
      dayIndex
    );

    return (
      <DayTab
        key={`${currentWeek}-${tabId}`}
        day={session}
        sessions={[session]}
        schedule={schedule}
        onNoteChange={(note, completed) =>
          handleNoteChange(dayIndex, note, completed)
        }
        savedNote={saved?.note}
        savedCompleted={saved?.completed ?? Boolean(isGarminMatched(currentWeek, dayIndex))}
        garminMatch={isGarminMatched(currentWeek, dayIndex)}
        bonusCompleted={filterBonusTrackingForDay(
          bonusTracking,
          currentWeek,
          dayIndex
        )}
        onBonusToggle={handleBonusToggle}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Prep Triathlon
              </p>
              <h1 className="text-lg font-bold text-white leading-tight mt-0.5">
                {plan.athlete.prenom} — {plan.athlete.raceName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Objectif {plan.athlete.raceGoal} · {plan.athlete.raceDate}
                {garminConnected && (
                  <span className="ml-2 text-emerald-400">· Garmin sync</span>
                )}
              </p>
            </div>
            <select
              value={currentWeek}
              onChange={(e) => {
                setCurrentWeek(parseInt(e.target.value, 10));
                setActiveTab("overview");
              }}
              className="glass-select px-3 py-2 rounded-xl text-xs font-medium shrink-0 max-w-[140px]"
            >
              {plan.weeks.map((w) => (
                <option key={w.num} value={w.num}>
                  S{w.num} · {w.dates.split(" – ")[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <nav className="sticky top-[76px] z-40 glass-header border-t-0">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {dayTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const sportStyle = tab.sport
                ? getDisciplineStyle(tab.sport.disciplineKey)
                : null;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`day-pill flex flex-col items-center min-w-[52px] px-2 py-2 rounded-2xl border ${
                    isActive
                      ? "day-pill-active border-white/20"
                      : "border-transparent hover:bg-white/5"
                  }`}
                >
                  {tab.id === "overview" ? (
                    <>
                      <span
                        className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-400"}`}
                      >
                        {tab.label}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">Semaine</span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-400"}`}
                      >
                        {tab.label}
                      </span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {tab.date}
                      </span>
                      {tab.sport && sportStyle && (
                        <div className="flex flex-col items-center gap-0.5">
                          <div
                            className={`mt-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border ${sportStyle.bg} ${sportStyle.border}`}
                            title={tab.sport.discipline}
                          >
                            <SportIcon
                              disciplineKey={tab.sport.disciplineKey}
                              className="w-3 h-3"
                            />
                            <span
                              className={`text-[9px] font-semibold ${sportStyle.color}`}
                            >
                              {sportStyle.shortLabel}
                            </span>
                          </div>
                          {notes[`day-${DAY_TAB_IDS.indexOf(tab.id) - 1}`]
                            ?.completed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-8">
        {renderTabContent(activeTab)}
      </main>

      <footer className="glass-header py-3 mt-auto">
        <div className="max-w-2xl mx-auto px-4 text-center text-[11px] text-slate-500">
          <p>1.5K natation · 40K vélo +800m D+ · 10K course</p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
