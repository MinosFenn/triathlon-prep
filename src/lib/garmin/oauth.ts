import { getGarminConfig } from "./config";
import { setGarminTokens } from "./store";
import type { GarminTokens } from "./types";

export function buildAuthorizeUrl(
  codeChallenge: string,
  state: string
): string {
  const { clientId, redirectUri, authorizeUrl } = getGarminConfig();
  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${authorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<GarminTokens> {
  const { clientId, clientSecret, redirectUri, tokenUrl } = getGarminConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId!,
    client_secret: clientSecret!,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Garmin token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  };

  const tokens: GarminTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type,
    scope: data.scope,
  };

  await setGarminTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<GarminTokens> {
  const { clientId, clientSecret, tokenUrl } = getGarminConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId!,
    client_secret: clientSecret!,
    refresh_token: refreshToken,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Garmin token refresh failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };

  const tokens: GarminTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type,
  };

  await setGarminTokens(tokens);
  return tokens;
}

export async function getValidAccessToken(): Promise<string | null> {
  const { getGarminTokens } = await import("./store");
  const tokens = await getGarminTokens();
  if (!tokens) return null;

  if (tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken;
  }

  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    return refreshed.accessToken;
  } catch {
    return null;
  }
}
