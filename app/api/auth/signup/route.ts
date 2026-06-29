import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import { decrypt } from "@/lib/crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { token, full_name, password } = await request.json();

    if (!token || !full_name || !password) {
      return NextResponse.json({ error: "Token, Full Name, and Password are required." }, { status: 400 });
    }

    // Decrypt and validate token
    const decrypted = decrypt(token);
    if (!decrypted || decrypted === token) {
      return NextResponse.json({ error: "Invalid invitation token." }, { status: 400 });
    }

    const data = JSON.parse(decrypted);

    // Check expiration
    if (data.exp && Date.now() > data.exp) {
      return NextResponse.json({ error: "Invitation link has expired." }, { status: 400 });
    }

    const { email, role, project_id, server_stats_access } = data;

    let createdProfile: any = null;

    if (isDemoMode) {
      if (role === "ADMIN") {
        createdProfile = demoDbOperations.createAdminProfile(email, full_name, !!server_stats_access);
      } else {
        createdProfile = demoDbOperations.createClientProfile(email, full_name, project_id || null);
      }
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      
      // Dedicated server-side client to avoid session pollution
      const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      // Sign up user in Auth
      const { data: authData, error: authError } = await supabaseServer.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create authentication user.");
      }

      // Upsert profile mapping with the newly created Auth user ID and correct role
      let profileData = null;
      const { data: upsertData, error: profileError } = await supabase!
        .from("profiles")
        .upsert({
          id: authData.user.id,
          email,
          full_name,
          role,
          project_id: project_id || null,
          server_stats_access: role === "ADMIN" ? !!server_stats_access : false,
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (profileError) {
        console.warn("Full profile upsert failed, attempting fallback with email but without server_stats_access:", profileError.message);
        
        // Try fallback with email, but without server_stats_access
        const { data: retryData, error: retryError } = await supabase!
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email,
            full_name,
            role,
            project_id: project_id || null,
            updated_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (retryError) {
          console.warn("Fallback with email failed, attempting final fallback without email or server_stats_access:", retryError.message);
          
          const { data: finalData, error: finalError } = await supabase!
            .from("profiles")
            .upsert({
              id: authData.user.id,
              full_name,
              role,
              project_id: project_id || null,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (finalError) throw finalError;
          profileData = finalData;
        } else {
          profileData = retryData;
        }
      } else {
        profileData = upsertData;
      }

      createdProfile = profileData;
    }

    return NextResponse.json({ success: true, profile: createdProfile });
  } catch (error: any) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Failed to complete signup", details: error.message }, { status: 500 });
  }
}
