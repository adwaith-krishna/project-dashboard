import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import { createClient } from "@supabase/supabase-js";
import { encrypt } from "@/lib/crypto";

// GET: List all clients
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
      const profiles = demoDbOperations.getProfiles().filter(p => p.role === "CLIENT");
      const projects = demoDbOperations.getProjects();
      list = profiles.map(profile => {
        const project = projects.find(p => p.id === profile.project_id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          project_id: profile.project_id,
          project_name: project ? project.name : null,
          updated_at: profile.updated_at
        };
      });
    } else {
      // Fetch profiles with a join to projects (if any)
      const { data, error } = await supabase!
        .from("profiles")
        .select(`
          id, 
          full_name, 
          email, 
          project_id, 
          updated_at,
          projects:project_id ( name )
        `)
        .eq("role", "CLIENT")
        .order("full_name", { ascending: true });

      if (error) throw error;
      
      list = (data || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        project_id: item.project_id,
        project_name: item.projects ? item.projects.name : null,
        updated_at: item.updated_at
      }));
    }
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to list clients", details: error.message }, { status: 500 });
  }
}

// POST: Generate invitation token for a new client
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
    const { email, project_id } = body;

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

    // Generate token containing client registration metadata (valid for 24 hours)
    const tokenPayload = {
      email,
      role: "CLIENT",
      project_id: project_id || null,
      server_stats_access: false,
      exp: Date.now() + 24 * 60 * 60 * 1000
    };

    const token = encrypt(JSON.stringify(tokenPayload));
    const origin = request.nextUrl.origin;
    const onboardingLink = `${origin}/signup?token=${encodeURIComponent(token)}`;

    return NextResponse.json({ success: true, onboardingLink });
  } catch (error: any) {
    console.error("Generate client invitation failed:", error);
    return NextResponse.json({ error: "Failed to generate client invitation", details: error.message }, { status: 500 });
  }
}

// DELETE: Remove client access profile
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    if (isDemoMode) {
      demoDbOperations.deleteProfile(id);
    } else {
      // Deleting user profile. Note: Admin API keys would be needed to delete from auth.users,
      // but deleting the row from profiles prevents the portal view.
      const { error } = await supabase!
        .from("profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete client profile", details: error.message }, { status: 500 });
  }
}

// PUT: Update client permissions / project assignment
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
    const { id, project_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
    }

    if (isDemoMode) {
      demoDbOperations.updateProfile(id, { project_id: project_id || null });
    } else {
      const { error } = await supabase!
        .from("profiles")
        .update({
          project_id: project_id || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("role", "CLIENT");
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update client permissions", details: error.message }, { status: 500 });
  }
}
