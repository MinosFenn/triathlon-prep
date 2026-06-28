import { NextResponse } from "next/server";
import { getMatchedSessions } from "@/lib/garmin/webhook-handler";

export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await getMatchedSessions();
  return NextResponse.json({ matches });
}
