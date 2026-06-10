import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpu_usage, memory_usage, disk_usage, temperature, uptime } = body;

    if (
      cpu_usage === undefined ||
      memory_usage === undefined ||
      disk_usage === undefined ||
      temperature === undefined ||
      uptime === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required telemetry metrics (cpu_usage, memory_usage, disk_usage, temperature, uptime)" },
        { status: 400 }
      );
    }

    const payload = {
      cpu_usage: parseFloat(cpu_usage),
      memory_usage: parseFloat(memory_usage),
      disk_usage: parseFloat(disk_usage),
      temperature: parseFloat(temperature),
      uptime: String(uptime),
    };

    if (isDemoMode) {
      demoDbOperations.addRaspberryPiStat(payload);
    } else {
      const { error } = await supabase!
        .from("raspberrypi_stats")
        .insert([payload]);

      if (error) {
        console.warn("Table raspberrypi_stats insertion failed, falling back to in-memory cache:", error.message);
        demoDbOperations.addRaspberryPiStat(payload);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Raspberry Pi webhook payload parse failed:", err);
    return NextResponse.json({ error: "Failed to record server telemetry", details: err.message }, { status: 500 });
  }
}
