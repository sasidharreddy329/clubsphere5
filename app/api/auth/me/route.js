import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/server/auth";

export async function GET(request) {
  if (process.env.STATIC_EXPORT === "true") {
    return NextResponse.json({ user: null });
  }
  const user = await getSessionUser(request);
  return NextResponse.json({ user });
}
