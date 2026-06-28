import { loadAppData } from "@/lib/data";
import { StatsDashboard } from "@/components/stats/StatsDashboard";

export default function StatistiquesPage() {
  const data = loadAppData();
  return <StatsDashboard data={data} />;
}
