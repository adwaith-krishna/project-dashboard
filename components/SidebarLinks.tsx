"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FolderPlus, LogOut, Shield, ShieldAlert, Users, Server } from "lucide-react";

export default function SidebarLinks() {
  const pathname = usePathname();
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

  const navItems = [
    {
      name: "Project Metrics",
      href: "/admin/dashboard",
      icon: Activity,
      description: "Quotas & live deployment logs",
    },
    {
      name: "Server Stats",
      href: "/admin/server-stats",
      icon: Server,
      description: "Raspberrypi server statistics",
    },
    {
      name: "Client Accounts",
      href: "/admin/clients",
      icon: Users,
      description: "Onboard & map client access",
    },
    {
      name: "Admin Accounts",
      href: "/admin/admins",
      icon: Shield,
      description: "Manage admin access control",
    },
  ];

  return (
    <div className="flex flex-col flex-1 justify-between">
      {/* Navigation menu */}
      <nav className="space-y-1.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all group cursor-pointer ${
                isActive
                  ? "bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-200 font-medium"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
              <div className="flex flex-col">
                <span className="text-sm">{item.name}</span>
                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors mt-0.5 font-normal">
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout panel */}
      <div className="p-3 border-t border-zinc-900">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer font-medium disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 text-zinc-500 group-hover:text-red-400" />
          <span className="text-sm">{loggingOut ? "Logging Out..." : "Log Out"}</span>
        </button>
      </div>
    </div>
  );
}
