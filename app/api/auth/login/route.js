import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { applySessionCookie } from "../../../../lib/server/auth";
import { findUserByEmail, getStore, normalizeEmail, sanitizeUser } from "../../../../lib/server/store";

export async function POST(request) {
  const body = await request.json();
  const email = normalizeEmail(body?.email || "");
  const password = body?.password || "";

  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
  }

  const store = await getStore();
  if ((store.state.bannedUsers || []).includes(email)) {
    return NextResponse.json({ success: false, message: "This account is restricted by admin." }, { status: 403 });
  }

  const user = findUserByEmail(store, email);
  if (!user) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }

  const matches = await bcrypt.compare(password, user.passwordHash || "");
  if (!matches) {
    return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    message: user.role === "admin" ? "Admin access granted." : "Welcome back!",
    role: user.role,
    user: sanitizeUser(user)
  });

  return applySessionCookie(response, user);
}
