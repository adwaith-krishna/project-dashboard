import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import { encrypt } from "@/lib/crypto";

// GET: List all administrators
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
    let list = [];
    if (isDemoMode) {
      const profiles = demoDbOperations.getProfiles().filter(p => p.role === "ADMIN");
      list = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        server_stats_access: profile.server_stats_access !== false,
        updated_at: profile.updated_at
      }));
    } else {
      const { data, error } = await supabase!
        .from("profiles")
        .select("id, full_name, email, role, server_stats_access, updated_at")
        .eq("role", "ADMIN")
        .order("full_name", { ascending: true });

      if (error) {
        console.warn("Failed to fetch server_stats_access column from profiles, falling back to legacy fields:", error.message);
        const { data: fallbackData, error: fallbackError } = await supabase!
          .from("profiles")
          .select("id, full_name, email, role, updated_at")
          .eq("role", "ADMIN")
          .order("full_name", { ascending: true });
        
        if (fallbackError) throw fallbackError;
        list = (fallbackData || []).map(p => ({
          ...p,
          server_stats_access: true
        }));
      } else {
        list = data || [];
      }
    }
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to list administrators", details: error.message }, { status: 500 });
  }
}

// POST: Generate invitation token for a new admin
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { email, server_stats_access } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Check if user already exists
    let existingProfile = null;
    if (isDemoMode) {
      existingProfile = demoDbOperations.getProfileByEmail(email);
    } else {
      const { data } = await supabase!
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      existingProfile = data;
    }

    if (existingProfile) {
      return NextResponse.json({ error: "A user profile with this email address already exists." }, { status: 400 });
    }

    // Generate token containing registration metadata (valid for 24 hours)
    const tokenPayload = {
      email,
      role: "ADMIN",
      project_id: null,
      server_stats_access: !!server_stats_access,
      exp: Date.now() + 24 * 60 * 60 * 1000
    };

    const token = encrypt(JSON.stringify(tokenPayload));
    const origin = request.nextUrl.origin;
    const onboardingLink = `${origin}/signup?token=${encodeURIComponent(token)}`;

    return NextResponse.json({ success: true, onboardingLink });
  } catch (error: any) {
    console.error("Generate admin invitation failed:", error);
    return NextResponse.json({ error: "Failed to generate admin invitation", details: error.message }, { status: 500 });
  }
}

// DELETE: Remove admin access profile
export async function DELETE(request: NextRequest) {
  const sessionCookie = request.cookies.get("dashboard-session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let session: any = null;
  try {
    session = JSON.parse(decodeURIComponent(sessionCookie));
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    // Security check: cannot delete yourself
    if (session.id === id) {
      return NextResponse.json({ error: "You cannot revoke your own admin access." }, { status: 400 });
    }

    if (isDemoMode) {
      demoDbOperations.deleteProfile(id);
    } else {
      const { error } = await supabase!
        .from("profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete admin profile", details: error.message }, { status: 500 });
  }
}

// PUT: Update admin permissions
export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { id, server_stats_access } = body;

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required." }, { status: 400 });
    }

    if (isDemoMode) {
      demoDbOperations.updateProfile(id, { server_stats_access: !!server_stats_access });
    } else {
      const { error } = await supabase!
        .from("profiles")
        .update({
          server_stats_access: !!server_stats_access,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("role", "ADMIN");
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update admin permissions", details: error.message }, { status: 500 });
  }
}
