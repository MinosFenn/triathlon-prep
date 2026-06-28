export function getGarminConfig() {
  const clientId = process.env.GARMIN_CLIENT_ID;
  const clientSecret = process.env.GARMIN_CLIENT_SECRET;
  const redirectUri =
    process.env.GARMIN_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/garmin/callback`;
  const webhookSecret = process.env.GARMIN_WEBHOOK_SECRET;
  const athleteId = process.env.GARMIN_ATHLETE_ID ?? "simon";

  return {
    clientId,
    clientSecret,
    redirectUri,
    webhookSecret,
    athleteId,
    isConfigured: Boolean(clientId && clientSecret),
    authorizeUrl: "https://connect.garmin.com/oauth2Confirm",
    tokenUrl: "https://diauth.garmin.com/di-oauth2-service/oauth/token",
    /** Activity API pull (after ping callback) — evaluation base */
    apiBaseUrl:
      process.env.GARMIN_API_BASE_URL ??
      "https://apis.garmin.com/wellness-api/rest",
  };
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
