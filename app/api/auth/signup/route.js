import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getStore, normalizeEmail, saveStore, sanitizeUser } from "../../../../lib/server/store";

export async function POST(request) {
  const body = await request.json();
  const name = body?.name?.trim() || "";
  const email = normalizeEmail(body?.email || "");
  const password = body?.password?.trim() || "";

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, message: "Name, email, and password are required." }, { status: 400 });
  }

  const store = await getStore();
  if (store.users.some((user) => user.email === email)) {
    return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  store.users.unshift({
    id: `u-${Date.now()}`,
    name,
    email,
    passwordHash,
    role: "member",
    authType: "credentials",
    createdAt: new Date().toISOString()
  });
  await saveStore(store);

  return NextResponse.json({
    success: true,
    message: "Account created. You can now login.",
    user: sanitizeUser(store.users[0])
  });
}
