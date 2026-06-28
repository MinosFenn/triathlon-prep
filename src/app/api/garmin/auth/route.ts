import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGarminConfig } from "@/lib/garmin/config";
import { buildAuthorizeUrl } from "@/lib/garmin/oauth";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "@/lib/garmin/pkce";

export async function GET() {
  const { isConfigured } = getGarminConfig();

  if (!isConfigured) {
    return NextResponse.json(
      {
        error:
          "Garmin non configuré. Renseigne GARMIN_CLIENT_ID et GARMIN_CLIENT_SECRET dans .env.local",
      },
      { status: 503 }
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  const cookieStore = await cookies();
  cookieStore.set("garmin_oauth_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("garmin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const url = buildAuthorizeUrl(challenge, state);
  return NextResponse.redirect(url);
}
