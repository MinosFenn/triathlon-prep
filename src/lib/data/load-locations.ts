import fs from "fs";
import { contentPath } from "@/lib/content-path";
import type {
  BaseLocation,
  LocationDefaults,
  LocationsData,
  TrainingRoute,
  Venue,
} from "@/types/locations";

function readLocationJson<T>(filename: string): T {
  const filePath = contentPath("data", "locations", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function loadLocations(): LocationsData {
  const { bases } = readLocationJson<{ bases: BaseLocation[] }>("bases.json");
  const { venues } = readLocationJson<{ venues: Venue[] }>("venues.json");
  const runData = readLocationJson<{ routes: TrainingRoute[] }>("routes-run.json");
  const bikeData = readLocationJson<{ routes: TrainingRoute[] }>("routes-bike.json");
  const defaults = readLocationJson<LocationDefaults>("defaults.json");

  return {
    bases,
    venues,
    routes: [...runData.routes, ...bikeData.routes],
    defaults,
  };
}
