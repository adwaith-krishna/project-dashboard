import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing invitation token." }, { status: 400 });
    }

    const decrypted = decrypt(token);
    if (!decrypted || decrypted === token) {
      return NextResponse.json({ error: "Invalid or corrupted invitation token." }, { status: 400 });
    }

    const data = JSON.parse(decrypted);
    
    // Check expiration
    if (data.exp && Date.now() > data.exp) {
      return NextResponse.json({ error: "Invitation link has expired." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      email: data.email,
      role: data.role,
      project_id: data.project_id || null
    });
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid or malformed invitation token." }, { status: 400 });
  }
}
