import { NextRequest, NextResponse } from "next/server";
import { getGarminConfig } from "@/lib/garmin/config";
import {
  processGarminPingCallbacks,
  processGarminWebhookPayload,
} from "@/lib/garmin/webhook-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Garmin domain verification (GET) + push/ping webhooks (POST) */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("garmin-challenge");
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: true, service: "garmin-webhook" });
}

export async function POST(request: NextRequest) {
  const { webhookSecret } = getGarminConfig();
  const headerSecret = request.headers.get("x-garmin-webhook-secret");

  if (webhookSecret && headerSecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Respond immediately — Garmin expects fast 200
  void handleWebhookAsync(body).catch(console.error);

  return NextResponse.json({ ok: true });
}

async function handleWebhookAsync(body: unknown) {
  const payload = body as Record<string, unknown>;

  // Push: data included directly
  if (
    payload.activities ||
    payload.activityDetails ||
    payload.manuallyUpdatedActivities
  ) {
    await processGarminWebhookPayload(
      payload as Parameters<typeof processGarminWebhookPayload>[0]
    );
    return;
  }

  // Ping: array of { callbackURL }
  const pingItems = (payload.activityFiles ??
    payload.activities ??
    []) as Array<{ callbackURL?: string }>;

  const callbackUrls = pingItems
    .map((item) => item.callbackURL)
    .filter((url): url is string => Boolean(url));

  if (callbackUrls.length > 0) {
    await processGarminPingCallbacks(callbackUrls);
  }
}
