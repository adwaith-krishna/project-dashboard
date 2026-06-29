import { NextRequest, NextResponse } from "next/server";
import { supabase, isDemoMode } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  // Check authorization header to verify request comes from Vercel's Cron engine
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode || !supabase) {
    return NextResponse.json({ message: "Demo mode active, no Supabase ping required." });
  }

  try {
    // Perform a lightweight query to simulate database activity and keep Supabase awake
    const { error } = await supabase.from("projects").select("id").limit(1);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Supabase database pinged successfully." });
  } catch (err: any) {
    console.error("Supabase keep-alive cron failed:", err);
    return NextResponse.json({ error: "Failed to ping Supabase", details: err.message }, { status: 500 });
  }
}
