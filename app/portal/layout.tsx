import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import PortalSidebar from "@/components/PortalSidebar";

async function getProjectName(projectId: string) {
  if (isDemoMode) {
    const project = demoDbOperations.getProjectById(projectId);
    return project?.name || "Client Website";
  }

  const { data, error } = await supabase!
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    return "Client Website";
  }
  return data.name;
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dashboard-session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let session: any = null;
  try {
    session = JSON.parse(decodeURIComponent(sessionCookie));
  } catch (e) {
    console.error("PortalLayout session parsing failed:", e);
    redirect("/login");
  }

  if (session.role !== "CLIENT" || !session.project_id) {
    redirect("/login?error=denied");
  }

  const projectName = await getProjectName(session.project_id);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Isolated Client Navigation */}
      <PortalSidebar
        fullName={session.full_name || "Client Member"}
        email={session.email || ""}
        projectName={projectName}
      />

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Secure status header */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-955/40 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-200 font-display">
              Metrics Console
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span>Client Isolated Mode</span>
          </div>
        </header>

        {/* Client dashboard router viewport */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
