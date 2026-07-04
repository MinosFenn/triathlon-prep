import type { DailySupplementsByWeek } from "@/lib/supplements-daily";
export type {
  BaseLocation,
  BaseType,
  LocationsData,
  RouteProfile,
  TrainingRoute,
  Venue,
  VenueType,
  Waypoint,
} from "@/types/locations";
import type { LocationsData } from "@/types/locations";

export type DisciplineKey = "bike" | "run" | "swim" | "brick" | "strength" | "recovery";

export interface SessionSegment {
  label: string;
  description: string;
  durationMin: number;
}

export interface TrainingSession {
  day: string;
  dayShort: string;
  date: string;
  /** YYYY-MM-DD pour météo et tri */
  dateIso: string;
  discipline: string;
  disciplineKey: DisciplineKey;
  type: string;
  details: string;
  zone: string;
  material: string;
  /** Lieu / circuit (depuis training_semaine{N}.md) */
  location: string;
  notes: string;
  segments: SessionSegment[];
  estimatedMinutes: number;
  points: number;
  adjusted?: string;
}

export interface WeekVolume {
  natation: string;
  velo: string;
  course: string;
  brick: string;
}

export interface WeekPlan {
  num: number;
  dateDebut: string;
  dateFin: string;
  dates: string;
  objective: string;
  volume: WeekVolume;
  volumeSummary: string;
  focus: string[];
  tests?: string[];
  events?: string[];
}

export interface PlanTest {
  semaine: number;
  type: string;
  date: string;
  details: string;
}

export interface PlanEvent {
  date: string;
  type: string;
  adaptation: string;
}

export interface TriathlonPlan {
  objectif: string;
  dureeTotale: string;
  athlete: AthleteProfile;
  weeks: WeekPlan[];
  tests: PlanTest[];
  events: PlanEvent[];
}

export interface AthleteProfile {
  prenom: string;
  poids: string;
  taille: string;
  entrainement: string;
  pointFaible: string;
  raceName: string;
  raceDate: string;
  raceGoal: string;
}

export interface NutritionData {
  rules: string[];
  lunchPlates: MealPlate[];
  dinnerPlates: MealPlate[];
  longWorkoutDay: { time: string; food: string }[];
  shoppingList: ShoppingCategory[];
  intenseDays: { lunch: string; dinner: string };
  moderateDays: { lunch: string; dinner: string };
}

export interface MealPlate {
  name: string;
  when: string;
  ingredients?: string;
  macros?: string;
}

export interface ShoppingCategory {
  category: string;
  items: string[];
}

export interface Supplement {
  name: string;
  dose: string;
  when: string;
  benefits: string;
}

export interface SupplementWeekSchedule {
  week: number;
  supplements: Supplement[];
}

export interface StrengthSession {
  day: string;
  type: string;
  duration: string;
  exercises: string;
  estimatedMinutes: number;
  points: number;
}

export interface StretchingData {
  daily: string[];
  preWorkout: string;
  postWorkout: string;
  routine: { moment: string; stretches: string; duration: string }[];
}

export interface MentalData {
  techniques: string[];
  weeklyPlan: { day: string; activity: string; duration?: string; timing?: string }[];
}

export interface CalendarEntry {
  type: "Test" | "Échéance";
  name: string;
  date: string;
  week: number | null;
  discipline: string;
  description: string;
  objective: string;
  material: string;
  notes: string;
}

export interface WeekNotes {
  [dayKey: string]: { note: string; completed?: boolean };
}

export type DayTabId =
  | "overview"
  | "lun"
  | "mar"
  | "mer"
  | "jeu"
  | "ven"
  | "sam"
  | "dim";

export interface StrengthData {
  descriptionsByWeek: Record<number, string>;
  sessionsByWeek: Record<number, StrengthSession[]>;
}

export interface AppData {
  plan: TriathlonPlan;
  sessionsByWeek: Record<number, TrainingSession[]>;
  nutrition: NutritionData;
  supplementsByWeek: Record<number, Supplement[]>;
  dailySupplementsByWeek: DailySupplementsByWeek;
  strength: StrengthData;
  stretching: StretchingData;
  mental: MentalData;
  calendar: CalendarEntry[];
  tipsByWeek: Record<number, string[]>;
  locations: LocationsData;
}
