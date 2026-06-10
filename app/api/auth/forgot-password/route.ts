import { NextRequest, NextResponse } from "next/server";
import { isDemoMode, supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (isDemoMode) {
      // Mock sending password reset for demo database
      console.log(`Demo Mode: Password reset link requested for email ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: "Demo Mode: Password reset link requested. You can access the reset form directly at /reset-password" 
      });
    } else {
      const origin = request.nextUrl.origin;
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Forgot password API failed:", error);
    return NextResponse.json({ error: "Failed to process password reset request", details: error.message }, { status: 500 });
  }
}
