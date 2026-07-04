import { loadAllSessions } from "../src/lib/data/load-plan";

const sessionsByWeek = loadAllSessions();
for (let w = 1; w <= 13; w++) {
  const sessions = sessionsByWeek[w] ?? [];
  const points = sessions
    .filter((s) => s.disciplineKey !== "recovery")
    .reduce((sum, s) => sum + s.points, 0);
  console.log(`S${w}: ${points} pts`);
}
