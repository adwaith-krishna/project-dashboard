import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("dashboard-session", "", { maxAge: -1, path: "/" });
  return response;
}
