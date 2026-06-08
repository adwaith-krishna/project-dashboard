import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let profile: any = null;

    if (isDemoMode) {
      profile = demoDbOperations.getProfileByEmail(email);
      if (!profile) {
        return NextResponse.json({ error: "User profile not found in Demo Database." }, { status: 401 });
      }
    } else {
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || "Invalid credentials." }, { status: 401 });
      }

      // Fetch user profile from profiles table
      const { data: profileData, error: profileError } = await supabase!
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        // Self-healing: try to insert a profile row.
        const defaultRole = email.toLowerCase().includes("admin") ? "ADMIN" : "CLIENT";
        console.warn(`Profile not found for authenticated user ${authData.user.id}. Attempting auto-creation...`);
        
        try {
          const { data: newProfile, error: insertError } = await supabase!
            .from("profiles")
            .insert({
              id: authData.user.id,
              full_name: email.split("@")[0],
              role: defaultRole,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Auto-creating profile in DB failed (table may be missing):", insertError);
            // Fallback to session-only profile
            profile = {
              id: authData.user.id,
              email: email,
              role: defaultRole,
              project_id: null,
              full_name: email.split("@")[0],
            };
          } else {
            profile = {
              id: newProfile.id,
              email: email,
              role: newProfile.role,
              project_id: newProfile.project_id,
              full_name: newProfile.full_name,
            };
          }
        } catch (e) {
          console.error("Profile auto-creation threw exception:", e);
          // Fallback to session-only profile
          profile = {
            id: authData.user.id,
            email: email,
            role: defaultRole,
            project_id: null,
            full_name: email.split("@")[0],
          };
        }
      } else {
        profile = {
          id: profileData.id,
          email: email,
          role: profileData.role,
          project_id: profileData.project_id,
          full_name: profileData.full_name,
        };
      }
    }

    // Auto-link CLIENT users to the first project if they don't have one mapped (for testing convenience)
    if (profile.role === "CLIENT" && !profile.project_id) {
      try {
        let firstProjId: string | null = null;
        if (isDemoMode) {
          const projs = demoDbOperations.getProjects();
          if (projs.length > 0) firstProjId = projs[0].id;
        } else {
          const { data: firstProj } = await supabase!
            .from("projects")
            .select("id")
            .limit(1);
          if (firstProj && firstProj.length > 0) {
            firstProjId = firstProj[0].id;
            // Update profiles table
            await supabase!
              .from("profiles")
              .update({ project_id: firstProjId })
              .eq("id", profile.id);
          }
        }
        if (firstProjId) {
          profile.project_id = firstProjId;
          console.log(`Auto-linked CLIENT user ${profile.id} to project ID ${firstProjId}`);
        }
      } catch (err) {
        console.error("Auto-linking client to first project failed:", err);
      }
    }

    const sessionData = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      project_id: profile.project_id,
      full_name: profile.full_name,
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    response.cookies.set("dashboard-session", JSON.stringify(sessionData), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API execution error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
