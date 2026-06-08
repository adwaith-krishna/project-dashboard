import React from "react";
import { cookies } from "next/headers";
import { Activity, ShieldCheck } from "lucide-react";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import SidebarLinks from "@/components/SidebarLinks";
import ProjectSelector from "@/components/ProjectSelector";

async function getProjects() {
  if (isDemoMode) {
    return demoDbOperations.getProjects();
  }

  const { data, error } = await supabase!
    .from("projects")
    .select("id, name, domain")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error retrieving projects:", error);
    return [];
  }
  return data || [];
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dashboard-session")?.value;
  let session = { full_name: "System Admin", email: "admin@dashboard.com" };

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      session = {
        full_name: parsed.full_name || "System Admin",
        email: parsed.email || "admin@dashboard.com",
      };
    } catch (e) {
      console.error("Layout failed to parse session cookie:", e);
    }
  }

  const projects = await getProjects();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar container */}
      <aside className="w-72 border-r border-zinc-900 bg-zinc-950 flex flex-col z-20">
        {/* Sidebar Header Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-900 bg-zinc-950">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/25 text-indigo-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white tracking-wide uppercase">
              Zedbe Projects
            </h2>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 flex flex-col py-6 overflow-y-auto">
          <SidebarLinks />
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/40">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-600/10">
              {session.full_name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate leading-none mb-0.5">
                {session.full_name}
              </span>
              <span className="text-[10px] text-zinc-500 truncate">
                {session.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex flex-col">
          </div>
          
          <ProjectSelector projects={projects} />
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
