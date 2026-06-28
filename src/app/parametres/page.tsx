import { GarminConnectPanel } from "@/components/garmin/GarminConnectPanel";

interface PageProps {
  searchParams: Promise<{ garmin?: string; message?: string }>;
}

export default async function ParametresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialMessage: string | null = null;

  if (params.garmin === "connected") {
    initialMessage = "Garmin Connect lié avec succès.";
  } else if (params.garmin === "error") {
    initialMessage = `Erreur Garmin : ${params.message ?? "inconnue"}`;
  }

  return <GarminConnectPanel initialMessage={initialMessage} />;
}
