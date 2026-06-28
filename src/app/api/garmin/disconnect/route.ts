import { NextResponse } from "next/server";
import { disconnectGarmin } from "@/lib/garmin/webhook-handler";

export async function POST() {
  await disconnectGarmin();
  return NextResponse.json({ ok: true });
}
