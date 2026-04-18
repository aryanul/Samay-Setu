import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ss_architect_draft";
/** Draft session lifetime after LinkedIn sign-in (seconds). */
const MAX_AGE_SECONDS = 60 * 60 * 2;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type ArchitectDraft = {
  linkedin_sub: string;
  name: string;
  email?: string;
  picture?: string;
  headline?: string;
};

export async function createArchitectDraft(draft: ArchitectDraft) {
  const token = await new SignJWT({
    name: draft.name,
    email: draft.email ?? "",
    picture: draft.picture ?? "",
    headline: draft.headline ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(draft.linkedin_sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readArchitectDraft(): Promise<ArchitectDraft | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      linkedin_sub: String(payload.sub),
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" && payload.email ? payload.email : undefined,
      picture: typeof payload.picture === "string" && payload.picture ? payload.picture : undefined,
      headline: typeof payload.headline === "string" && payload.headline ? payload.headline : undefined,
    };
  } catch {
    return null;
  }
}

export async function clearArchitectDraft() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
