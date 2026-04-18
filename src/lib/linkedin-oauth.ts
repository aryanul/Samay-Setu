/**
 * LinkedIn OAuth 2.0 (Sign In with LinkedIn — OpenID Connect).
 * Required env: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET.
 * Optional: NEXT_PUBLIC_APP_URL (e.g. https://yourdomain.com) for redirect URI; defaults to http://localhost:3000 in development.
 */

export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getLinkedInRedirectUri(): string {
  return `${getAppBaseUrl()}/api/auth/linkedin/callback`;
}

export function assertLinkedInConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

const LINKEDIN_AUTH = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO = "https://api.linkedin.com/v2/userinfo";
/** Optional: headline when the app has profile API access for the token. */
const LINKEDIN_ME =
  "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,headline,profilePicture(displayImage~:playableStreams))";

export function buildLinkedInAuthorizeUrl(state: string): string {
  const { clientId } = assertLinkedInConfig();
  const redirectUri = getLinkedInRedirectUri();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });
  return `${LINKEDIN_AUTH}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{ access_token: string }> {
  const { clientId, clientSecret } = assertLinkedInConfig();
  const redirectUri = getLinkedInRedirectUri();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(LINKEDIN_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("LinkedIn token response missing access_token");
  }
  return { access_token: json.access_token };
}

type LinkedInUserInfo = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
};

type LinkedInMeProjection = {
  headline?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
};

export async function fetchLinkedInProfile(accessToken: string): Promise<{
  linkedin_sub: string;
  name: string;
  email?: string;
  picture?: string;
  headline?: string;
}> {
  const userinfoRes = await fetch(LINKEDIN_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userinfoRes.ok) {
    const text = await userinfoRes.text();
    throw new Error(`LinkedIn userinfo failed: ${userinfoRes.status} ${text}`);
  }
  const userinfo = (await userinfoRes.json()) as LinkedInUserInfo;
  if (!userinfo.sub) {
    throw new Error("LinkedIn userinfo missing sub");
  }
  const given = userinfo.given_name?.trim() ?? "";
  const family = userinfo.family_name?.trim() ?? "";
  const composed =
    userinfo.name?.trim() ||
    [given, family].filter(Boolean).join(" ").trim() ||
    "LinkedIn member";

  let headline: string | undefined;
  const meRes = await fetch(LINKEDIN_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (meRes.ok) {
    const me = (await meRes.json()) as LinkedInMeProjection;
    if (typeof me.headline === "string" && me.headline.trim()) {
      headline = me.headline.trim();
    }
  }

  return {
    linkedin_sub: userinfo.sub,
    name: composed,
    email: userinfo.email?.trim() || undefined,
    picture: typeof userinfo.picture === "string" ? userinfo.picture : undefined,
    headline,
  };
}
