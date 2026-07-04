import type { DayTabId, DisciplineKey, TrainingSession } from "@/types";
import type {
  BaseLocation,
  LocationsData,
  TrainingRoute,
  Venue,
} from "@/types/locations";

function normalizeDayId(day: string): DayTabId {
  return day.toLowerCase().slice(0, 3) as DayTabId;
}

export function getBaseForDay(
  locations: LocationsData,
  dayId: DayTabId | string
): BaseLocation | null {
  const normalized = normalizeDayId(dayId);
  return locations.bases.find((b) => b.weekdays.includes(normalized)) ?? null;
}

export function getBaseById(
  locations: LocationsData,
  id: string
): BaseLocation | undefined {
  return locations.bases.find((b) => b.id === id);
}

export function getVenuesForDiscipline(
  locations: LocationsData,
  discipline: DisciplineKey
): Venue[] {
  return locations.venues.filter((v) => v.discipline === discipline);
}

export function getRoutesForDiscipline(
  locations: LocationsData,
  discipline: DisciplineKey
): TrainingRoute[] {
  return locations.routes.filter((r) => r.discipline === discipline);
}

export function getVenueById(
  locations: LocationsData,
  id: string
): Venue | undefined {
  return locations.venues.find((v) => v.id === id);
}

export function getRouteById(
  locations: LocationsData,
  id: string
): TrainingRoute | undefined {
  return locations.routes.find((r) => r.id === id);
}

/** Point météo / Maps pour une séance : base du jour ou premier lieu pertinent */
export function resolveSessionGeo(
  locations: LocationsData,
  session: TrainingSession
): { lat: number; lon: number; label: string } {
  const dayId = normalizeDayId(session.dayShort);
  const base = getBaseForDay(locations, dayId);

  if (session.disciplineKey === "swim") {
    const pool = getVenueById(locations, "pool-vernets");
    if (pool) {
      return { lat: pool.lat, lon: pool.lon, label: pool.name };
    }
  }

  if (session.disciplineKey === "run") {
    const route = getRouteById(locations, "run-arve-12");
    if (route?.waypoints[0]) {
      const wp = route.waypoints[0];
      return { lat: wp.lat, lon: wp.lon, label: route.name };
    }
  }

  if (session.disciplineKey === "bike") {
    const route = getRouteById(locations, "bike-plaine-44");
    if (route?.waypoints[0]) {
      const wp = route.waypoints[0];
      return { lat: wp.lat, lon: wp.lon, label: route.name };
    }
  }

  if (base) {
    return { lat: base.lat, lon: base.lon, label: base.name };
  }

  return { lat: 46.2044, lon: 6.1432, label: "Genève" };
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function googleMapsDirectionsUrl(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}`;
}
