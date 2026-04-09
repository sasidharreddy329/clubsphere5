import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/server/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Signed out." });
  return clearSessionCookie(response);
}
