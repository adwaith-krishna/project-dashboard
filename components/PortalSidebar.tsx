"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, LogOut, BarChart3, Globe, Shield } from "lucide-react";

interface PortalSidebarProps {
  fullName: string;
  email: string;
  projectName: string;
}

export default function PortalSidebar({ fullName, email, projectName }: PortalSidebarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-72 border-r border-zinc-900 bg-zinc-955 flex flex-col z-20 h-screen shrink-0">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-900 bg-zinc-950">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold font-display text-white tracking-wide uppercase">
            Zedbe Portal
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Client Console</span>
          </div>
        </div>
      </div>

      {/* Static Info Block */}
      <div className="px-6 py-4.5 bg-zinc-950/20 border-b border-zinc-900/60">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scoped Scope</span>
        <span className="text-sm font-bold font-display text-emerald-400 block mt-1 truncate">
          {projectName}
        </span>
      </div>

      {/* Navigation items */}
      <div className="flex-grow py-6 flex flex-col justify-between">
        <nav className="space-y-1.5 px-3">
          <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-200 font-medium">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-sm">Web Analytics</span>
              <span className="text-[10px] text-zinc-500 mt-0.5 font-normal">
                Live traffic telemetry reports
              </span>
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer font-medium disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 text-zinc-500 group-hover:text-red-400" />
            <span className="text-sm">{loggingOut ? "Logging Out..." : "Log Out"}</span>
          </button>
        </div>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/40">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-600/10">
            {fullName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate leading-none mb-0.5">
              {fullName}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {email}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
