import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("dashboard-session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    let stats = [];

    if (isDemoMode) {
      stats = [...demoDbOperations.getRaspberryPiStats()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      // Fetch up to last 100 stats reported from live DB Zone, ordered desc
      const { data, error } = await supabase!
        .from("raspberrypi_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        // Graceful fallback if database column/table doesn't exist yet
        console.warn("Table raspberrypi_stats query failed, falling back to in-memory cache:", error.message);
        stats = [...demoDbOperations.getRaspberryPiStats()].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        stats = data || [];
      }
    }

    // Reverse so it's chronologically sorted for charting: oldest first
    const chartHistory = [...stats].reverse();
    const latest = stats[0] || null;

    return NextResponse.json({
      latest,
      history: chartHistory
    });
  } catch (err: any) {
    console.error("Retrieve Pi telemetry failed:", err);
    return NextResponse.json({ error: "Failed to load server stats", details: err.message }, { status: 500 });
  }
}
