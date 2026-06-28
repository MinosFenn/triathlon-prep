import { NextResponse } from "next/server";
import { getGarminConnectionStatus } from "@/lib/garmin/webhook-handler";
import { getGarminConfig } from "@/lib/garmin/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const { isConfigured } = getGarminConfig();
  const status = await getGarminConnectionStatus();

  return NextResponse.json({
    configured: isConfigured,
    ...status,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/garmin/webhook`,
  });
}
