import fs from "fs";
import path from "path";
import type { GarminStoreData, GarminTokens, StoredGarminActivity } from "./types";

const STORE_KEY = "garmin:store";
const LOCAL_PATH = path.join(process.cwd(), "data", "garmin", "store.json");

function emptyStore(): GarminStoreData {
  return { tokens: null, activities: [] };
}

async function readFromRedis(): Promise<GarminStoreData | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(`${url}/get/${STORE_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { result?: string | null };
  if (!json.result) return emptyStore();
  return JSON.parse(json.result) as GarminStoreData;
}

async function writeToRedis(data: GarminStoreData): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  await fetch(`${url}/set/${STORE_KEY}/${encodeURIComponent(JSON.stringify(data))}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

function readFromFile(): GarminStoreData {
  try {
    if (!fs.existsSync(LOCAL_PATH)) return emptyStore();
    return JSON.parse(fs.readFileSync(LOCAL_PATH, "utf-8")) as GarminStoreData;
  } catch {
    return emptyStore();
  }
}

function writeToFile(data: GarminStoreData): void {
  const dir = path.dirname(LOCAL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_PATH, JSON.stringify(data, null, 2));
}

export async function loadGarminStore(): Promise<GarminStoreData> {
  const fromRedis = await readFromRedis();
  if (fromRedis) return fromRedis;
  return readFromFile();
}

export async function saveGarminStore(data: GarminStoreData): Promise<void> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    await writeToRedis(data);
  }
  writeToFile(data);
}

export async function getGarminTokens(): Promise<GarminTokens | null> {
  const store = await loadGarminStore();
  return store.tokens;
}

export async function setGarminTokens(tokens: GarminTokens): Promise<void> {
  const store = await loadGarminStore();
  store.tokens = tokens;
  await saveGarminStore(store);
}

export async function upsertGarminActivities(
  activities: StoredGarminActivity[]
): Promise<void> {
  const store = await loadGarminStore();
  const byId = new Map(store.activities.map((a) => [a.garminActivityId, a]));

  for (const activity of activities) {
    byId.set(activity.garminActivityId, activity);
  }

  store.activities = Array.from(byId.values()).sort(
    (a, b) => new Date(b.startTimeIso).getTime() - new Date(a.startTimeIso).getTime()
  );
  await saveGarminStore(store);
}

export async function listGarminActivities(): Promise<StoredGarminActivity[]> {
  const store = await loadGarminStore();
  return store.activities;
}
