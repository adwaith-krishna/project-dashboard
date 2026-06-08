import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";

// Parse OS and Browser from User Agent
function parseUserAgent(uaString: string | null) {
  if (!uaString) return { browser: "Unknown", os: "Unknown" };
  let browser = "Unknown";
  let os = "Unknown";
  const ua = uaString.toLowerCase();

  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome") && !ua.includes("edge") && !ua.includes("opr")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edge") || ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";
  
  return { browser, os };
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "Missing project_id query parameter" }, { status: 400 });
  }

  try {
    const textBody = await request.text();
    if (!textBody.trim()) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let rawEvents: any[] = [];

    // Parse NDJSON or regular JSON arrays
    try {
      if (textBody.startsWith("[")) {
        rawEvents = JSON.parse(textBody);
      } else if (textBody.includes("\n")) {
        rawEvents = textBody
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line));
      } else {
        rawEvents = [JSON.parse(textBody)];
      }
    } catch (e) {
      console.warn("Payload parsing as JSON failed, attempting fallback parsing:", e);
      return NextResponse.json({ error: "Invalid JSON payload format" }, { status: 400 });
    }

    const eventsToInsert = rawEvents.map((item) => {
      // Extract fields from Vercel log drain layout or generic client telemetry format
      const path = item.path || item.url || "/";
      const referrer = item.referrer || item.referer || item.headers?.referer || "Direct";
      
      const uaString = item.userAgent || item.ua || item.headers?.["user-agent"] || request.headers.get("user-agent") || "";
      const { browser, os } = parseUserAgent(uaString);

      const country = item.country || item.geo?.country || request.headers.get("x-vercel-ip-country") || "US";

      return {
        project_id: projectId,
        path,
        referrer,
        browser,
        os,
        country,
      };
    });

    if (isDemoMode) {
      eventsToInsert.forEach((evt) => {
        demoDbOperations.addAnalyticsEvent(evt);
      });
    } else {
      const { error } = await supabase!
        .from("analytics_events")
        .insert(eventsToInsert);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ success: true, count: eventsToInsert.length });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
