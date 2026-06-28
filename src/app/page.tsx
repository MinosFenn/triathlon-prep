import { loadAppData } from "@/lib/data";
import { TriathlonWeeklyPlan } from "@/components/triathlon/TriathlonWeeklyPlan";

export default function HomePage() {
  const data = loadAppData();

  return <TriathlonWeeklyPlan data={data} />;
}
