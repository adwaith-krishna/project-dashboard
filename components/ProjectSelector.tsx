"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Folder, Globe, Database } from "lucide-react";

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface ProjectSelectorProps {
  projects: Project[];
}

export default function ProjectSelector({ projects }: ProjectSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProjectId = searchParams.get("project_id");
  const selectedProject = selectedProjectId ? (projects.find((p) => p.id === selectedProjectId) || null) : null;

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (projectId: string) => {
    setIsOpen(false);
    // Preserving other search params if any
    const params = new URLSearchParams(searchParams.toString());
    params.set("project_id", projectId);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  if (!selectedProjectId) {
    return null;
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-500">
        <Database className="h-4 w-4" />
        No projects onboarded
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-200 transition-all font-medium cursor-pointer min-w-[200px]"
      >
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-indigo-400" />
          <span>{selectedProject ? selectedProject.name : "Select Project Scope"}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-panel border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-zinc-800/60 bg-zinc-900/30 flex justify-between items-center">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Switch Scope
            </span>
            <span className="text-[10px] text-zinc-650 font-semibold uppercase">
              {projects.length} Nodes
            </span>
          </div>
          <div className="border-b border-zinc-900/60">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/admin/dashboard");
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs transition-colors cursor-pointer text-indigo-400 hover:bg-zinc-900 hover:text-indigo-300 font-bold"
            >
              <Folder className="h-3.5 w-3.5" />
              All Projects Grid List
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {projects.map((project) => {
              const isSelected = project.id === selectedProject?.id;
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`w-full flex flex-col items-start px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/10 text-indigo-300 font-medium"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5 font-normal">
                    <Globe className="h-3 w-3" />
                    {project.domain}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
