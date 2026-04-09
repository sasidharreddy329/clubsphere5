import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/server/auth";
import { getStore, saveStore } from "../../../../lib/server/store";

export async function POST(request) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser?.email) {
    return NextResponse.json({ success: false, message: "Please login first." }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = body?.currentPassword || "";
  const nextPassword = body?.nextPassword?.trim() || "";

  if (!nextPassword) {
    return NextResponse.json({ success: false, message: "New password is required." }, { status: 400 });
  }

  const store = await getStore();
  const index = store.users.findIndex((entry) => entry.email === sessionUser.email);
  if (index === -1) {
    return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
  }

  const target = store.users[index];
  const matches = await bcrypt.compare(currentPassword, target.passwordHash || "");
  if (!matches) {
    return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
  }

  store.users[index] = {
    ...target,
    passwordHash: await bcrypt.hash(nextPassword, 10)
  };
  await saveStore(store);

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}
