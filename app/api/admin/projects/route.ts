import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import { encrypt } from "@/lib/crypto";

// GET: List all projects
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
      list = demoDbOperations.getProjects();
    } else {
      const { data, error } = await supabase!
        .from("projects")
        .select("id, name, domain, vercel_project_id, sanity_project_id, sanity_dataset, supabase_project_ref, encrypted_resend_api_key, created_at")
        .order("name", { ascending: true });
      if (error) throw error;
      list = data || [];
    }
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to list projects", details: error.message }, { status: 500 });
  }
}

// POST: Create a new project
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
    const { 
      name, 
      domain, 
      vercel_project_id, 
      sanity_project_id, 
      sanity_dataset, 
      supabase_project_ref,
      vercel_token, 
      sanity_token,
      supabase_anon_key,
      resend_api_key
    } = body;

    if (!name || !domain) {
      return NextResponse.json({ error: "Name and Domain are required fields." }, { status: 400 });
    }

    // Encrypt sensitive external api keys
    const encryptedVercelToken = vercel_token ? encrypt(vercel_token) : null;
    const encryptedSanityToken = sanity_token ? encrypt(sanity_token) : null;
    const encryptedSupabaseAnonKey = supabase_anon_key ? encrypt(supabase_anon_key) : null;
    const encryptedResendApiKey = resend_api_key ? encrypt(resend_api_key) : null;

    let created: any = null;

    if (isDemoMode) {
      created = demoDbOperations.createProject({
        name,
        domain,
        vercel_project_id: vercel_project_id || null,
        sanity_project_id: sanity_project_id || null,
        sanity_dataset: sanity_dataset || "production",
        supabase_project_ref: supabase_project_ref || null,
        encrypted_vercel_token: encryptedVercelToken,
        encrypted_sanity_token: encryptedSanityToken,
        encrypted_supabase_anon_key: encryptedSupabaseAnonKey,
        encrypted_resend_api_key: encryptedResendApiKey,
      });
    } else {
      const { data, error } = await supabase!
        .from("projects")
        .insert({
          name,
          domain,
          vercel_project_id: vercel_project_id || null,
          sanity_project_id: sanity_project_id || null,
          sanity_dataset: sanity_dataset || "production",
          supabase_project_ref: supabase_project_ref || null,
          encrypted_vercel_token: encryptedVercelToken,
          encrypted_sanity_token: encryptedSanityToken,
          encrypted_supabase_anon_key: encryptedSupabaseAnonKey,
          encrypted_resend_api_key: encryptedResendApiKey,
        })
        .select()
        .single();

      if (error) throw error;
      created = data;
    }

    return NextResponse.json({ success: true, project: created });
  } catch (error: any) {
    console.error("Create project action failed:", error);
    return NextResponse.json({ error: "Failed to create project", details: error.message }, { status: 500 });
  }
}

// PUT: Update an existing project
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
    const { 
      id,
      name, 
      domain, 
      vercel_project_id, 
      sanity_project_id, 
      sanity_dataset, 
      supabase_project_ref,
      vercel_token, 
      sanity_token,
      supabase_anon_key,
      resend_api_key
    } = body;

    if (!id || !name || !domain) {
      return NextResponse.json({ error: "ID, Name, and Domain are required fields." }, { status: 400 });
    }

    let updated: any = null;

    if (isDemoMode) {
      const updates: any = {
        name,
        domain,
        vercel_project_id: vercel_project_id || null,
        sanity_project_id: sanity_project_id || null,
        sanity_dataset: sanity_dataset || "production",
        supabase_project_ref: supabase_project_ref || null,
      };

      if (vercel_token) updates.encrypted_vercel_token = encrypt(vercel_token);
      if (sanity_token) updates.encrypted_sanity_token = encrypt(sanity_token);
      if (supabase_anon_key) updates.encrypted_supabase_anon_key = encrypt(supabase_anon_key);
      if (resend_api_key) updates.encrypted_resend_api_key = encrypt(resend_api_key);

      updated = demoDbOperations.updateProject(id, updates);
      if (!updated) {
        return NextResponse.json({ error: "Project not found in Demo Database" }, { status: 404 });
      }
    } else {
      const updatePayload: any = {
        name,
        domain,
        vercel_project_id: vercel_project_id || null,
        sanity_project_id: sanity_project_id || null,
        sanity_dataset: sanity_dataset || "production",
        supabase_project_ref: supabase_project_ref || null,
      };

      // Only update tokens if new ones were provided
      if (vercel_token) updatePayload.encrypted_vercel_token = encrypt(vercel_token);
      if (sanity_token) updatePayload.encrypted_sanity_token = encrypt(sanity_token);
      if (supabase_anon_key) updatePayload.encrypted_supabase_anon_key = encrypt(supabase_anon_key);
      if (resend_api_key) updatePayload.encrypted_resend_api_key = encrypt(resend_api_key);

      const { data, error } = await supabase!
        .from("projects")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      updated = data;
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("Update project action failed:", error);
    return NextResponse.json({ error: "Failed to update project", details: error.message }, { status: 500 });
  }
}

// DELETE: Delete a project
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
      demoDbOperations.deleteProject(id);
    } else {
      const { error } = await supabase!
        .from("projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete project", details: error.message }, { status: 500 });
  }
}
