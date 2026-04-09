import { NextResponse } from "next/server";
import { publicStore, getStore } from "../../../lib/server/store";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(publicStore(store), {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
