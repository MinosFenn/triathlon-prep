import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppUrl } from "@/lib/garmin/config";
import { exchangeCodeForTokens } from "@/lib/garmin/oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${getAppUrl()}/parametres`;

  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?garmin=error&message=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?garmin=error&message=missing_code`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("garmin_oauth_state")?.value;
  const verifier = cookieStore.get("garmin_oauth_verifier")?.value;

  if (!savedState || state !== savedState || !verifier) {
    return NextResponse.redirect(`${redirectBase}?garmin=error&message=invalid_state`);
  }

  try {
    await exchangeCodeForTokens(code, verifier);
    cookieStore.delete("garmin_oauth_state");
    cookieStore.delete("garmin_oauth_verifier");
    return NextResponse.redirect(`${redirectBase}?garmin=connected`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_exchange_failed";
    return NextResponse.redirect(
      `${redirectBase}?garmin=error&message=${encodeURIComponent(message)}`
    );
  }
}
