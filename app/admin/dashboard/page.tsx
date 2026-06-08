import React from "react";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import ProjectsGridView from "@/components/ProjectsGridView";

async function getProjectDetails(projectId: string) {
  if (isDemoMode) {
    const project = demoDbOperations.getProjectById(projectId);
    const events = demoDbOperations.getAnalyticsEvents(projectId).slice(0, 5);
    return { project, events };
  }

  const { data: project, error: pError } = await supabase!
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (pError || !project) {
    return { project: null, events: [] };
  }

  const { data: events, error: eError } = await supabase!
    .from("analytics_events")
    .select("id, path, referrer, browser, os, country, timestamp")
    .eq("project_id", projectId)
    .order("timestamp", { ascending: false });

  return { 
    project, 
    events: events || [] 
  };
}

async function getAllProjects() {
  if (isDemoMode) {
    return demoDbOperations.getProjects();
  }

  const { data, error } = await supabase!
    .from("projects")
    .select("id, name, domain, vercel_project_id, sanity_project_id, sanity_dataset, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error retrieving projects:", error);
    return [];
  }
  return data || [];
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  let projectId = params.project_id as string;

  if (!projectId) {
    const projects = await getAllProjects();
    return <ProjectsGridView projects={projects} />;
  }

  const { project, events } = await getProjectDetails(projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
        <h2 className="text-xl font-bold text-red-400 font-display">Project Not Found</h2>
        <p className="text-zinc-500 text-sm mt-2">
          The requested project ID specified in the URL does not exist or has been deleted.
        </p>
        <a
          href="/admin/dashboard"
          className="mt-6 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Return to Projects Scope
        </a>
      </div>
    );
  }

  return (
    <AdminDashboardClient
      projectId={projectId}
      initialProject={{
        id: project.id,
        name: project.name,
        domain: project.domain,
        vercel_project_id: project.vercel_project_id,
        sanity_project_id: project.sanity_project_id,
        sanity_dataset: project.sanity_dataset || "production",
      }}
      events={events.map((e: any) => ({
        id: e.id,
        path: e.path,
        referrer: e.referrer,
        browser: e.browser,
        os: e.os,
        country: e.country,
        timestamp: new Date(e.timestamp).toISOString(),
      }))}
    />
  );
}
