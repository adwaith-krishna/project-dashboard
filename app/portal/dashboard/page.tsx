import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode, supabase } from "@/lib/supabaseClient";
import { demoDbOperations } from "@/lib/demoData";
import ClientPortalDashboard from "@/components/ClientPortalDashboard";

async function getProjectDetails(projectId: string) {
  if (isDemoMode) {
    const project = demoDbOperations.getProjectById(projectId);
    const events = demoDbOperations.getAnalyticsEvents(projectId);
    return { project, events };
  }

  // Query database for client project configuration
  const { data: project, error: pError } = await supabase!
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (pError || !project) {
    return { project: null, events: [] };
  }

  // Retrieve raw logs strictly associated with client tenant ID
  const { data: events, error: eError } = await supabase!
    .from("analytics_events")
    .select("id, path, referrer, browser, os, country, timestamp")
    .eq("project_id", projectId)
    .order("timestamp", { ascending: false });

  return {
    project,
    events: events || [],
  };
}

export default async function PortalDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dashboard-session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let session: any = null;
  try {
    session = JSON.parse(decodeURIComponent(sessionCookie));
  } catch (e) {
    console.error("PortalDashboard page session parsing failed:", e);
    redirect("/login");
  }

  if (session.role !== "CLIENT" || !session.project_id) {
    redirect("/login?error=denied");
  }

  const { project, events } = await getProjectDetails(session.project_id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
        <h2 className="text-xl font-bold font-display text-red-400">Account Mapping Fault</h2>
        <p className="text-zinc-500 text-sm mt-2">
          Your client account is mapped to a project ID that does not exist in our systems.
        </p>
      </div>
    );
  }

  return (
    <ClientPortalDashboard
      projectName={project.name}
      domain={project.domain}
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
