import jwt from "jsonwebtoken";
import { findUserByEmail, getStore, sanitizeUser } from "./store";

export const SESSION_COOKIE = "clubsphere_session";

const sessionSecret = process.env.APP_JWT_SECRET || "clubsphere-dev-secret-change-me";

export function signSession(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role
    },
    sessionSecret,
    { expiresIn: "7d" }
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, sessionSecret);
  } catch {
    return null;
  }
}

export async function getSessionUser(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload?.email) return null;
  const store = await getStore();
  const user = findUserByEmail(store, payload.email);
  return sanitizeUser(user);
}

export function applySessionCookie(response, user) {
  const token = signSession(user);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
