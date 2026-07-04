import type { DayTabId, DisciplineKey } from "@/types";

export type BaseType = "home" | "work" | "work_client";

export type VenueType = "pool" | "open_water" | "track" | "indoor";

export type RouteProfile = "flat" | "rolling" | "mountain";

export type WaypointRole = "start" | "via" | "end";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface Waypoint extends GeoPoint {
  name: string;
  role: WaypointRole;
}

export interface BaseLocation extends GeoPoint {
  id: string;
  type: BaseType;
  name: string;
  address: string;
  /** lun, mar, mer, jeu, ven, sam, dim */
  weekdays: DayTabId[];
  notes?: string;
}

export interface Venue extends GeoPoint {
  id: string;
  discipline: DisciplineKey;
  type: VenueType;
  name: string;
  address: string;
  facilities?: string[];
  season?: string;
  bestFor?: string[];
  notes?: string;
}

export interface TrainingRoute {
  id: string;
  discipline: DisciplineKey;
  name: string;
  distanceKm: number;
  distanceRangeKm?: [number, number];
  elevationGainM: number;
  elevationRangeM?: [number, number];
  profile: RouteProfile;
  surface?: string;
  startBaseId?: string;
  reverseAllowed?: boolean;
  waypoints: Waypoint[];
  bestFor?: string[];
  notes?: string;
}

export interface ProximityHint {
  fromBaseId: string;
  minutesBike?: number;
  minutesTransit?: number;
  minutesRun?: number;
}

export interface LocationDefaults {
  sessionDefaults: {
    swim?: {
      venueIds: string[];
      openWaterVenueId?: string;
    };
    run?: {
      trackVenueId?: string;
      routeIds: string[];
    };
    bike?: {
      routeIds: string[];
    };
  };
  proximityHints?: Record<string, ProximityHint>;
}

export interface LocationsData {
  bases: BaseLocation[];
  venues: Venue[];
  routes: TrainingRoute[];
  defaults: LocationDefaults;
}
