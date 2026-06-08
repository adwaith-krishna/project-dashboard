"use client";

import React from "react";
import Link from "next/link";
import { 
  FolderPlus, Globe, Cloud, Server, ArrowRight, Activity, Calendar 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  domain: string;
  vercel_project_id: string | null;
  sanity_project_id: string | null;
  sanity_dataset: string;
  created_at: string;
}

interface ProjectsGridViewProps {
  projects: Project[];
}

export default function ProjectsGridView({ projects }: ProjectsGridViewProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-zinc-900/60 pb-6">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">
          Select or add projects
        </h2>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Project Cards */}
        {projects.map((project) => {
          const isVercelLinked = !!project.vercel_project_id;
          const isSanityLinked = !!project.sanity_project_id;

          return (
            <Link
              key={project.id}
              href={`/admin/dashboard?project_id=${project.id}`}
              className="group glass-panel glass-panel-hover rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between hover:border-indigo-500/25 transition-all text-left relative overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-base font-bold font-display text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mt-1 truncate">
                    <Globe className="h-3.5 w-3.5 text-zinc-650" />
                    <span>{project.domain}</span>
                  </div>
                </div>

                {/* Integration Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isVercelLinked 
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10" 
                      : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                  }`}>
                    <Cloud className="h-3 w-3" />
                    Vercel
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSanityLinked 
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10" 
                      : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                  }`}>
                    <Server className="h-3 w-3" />
                    Sanity
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <Calendar className="h-3 w-3" />
                  Added {formatDistanceToNow(new Date(project.created_at))} ago
                </span>
                
                <span className="flex items-center gap-1 text-xs font-semibold text-zinc-400 group-hover:text-indigo-400 transition-colors">
                  View Metrics
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}

        {/* Add Project Card */}
        <Link
          href="/admin/management"
          className="group flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-800 hover:border-indigo-500/40 bg-zinc-950/20 hover:bg-zinc-950/40 transition-all text-center min-h-[220px]"
        >
          <div className="h-12 w-12 rounded-xl bg-zinc-900 group-hover:bg-indigo-600/10 border border-zinc-800 group-hover:border-indigo-500/25 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-all mb-4">
            <FolderPlus className="h-6 w-6 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-sm font-bold font-display text-zinc-300 group-hover:text-indigo-300 transition-colors">
            Onboard Website Node
          </span>
          <p className="text-xs text-zinc-500 max-w-[180px] mt-1">
            Register a new client website domain and tokens.
          </p>
        </Link>

      </div>
    </div>
  );
}
