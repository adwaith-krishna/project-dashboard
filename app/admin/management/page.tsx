"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderPlus, Globe, Trash2, Key, Layers, Calendar, 
  AlertCircle, CheckCircle2, Cloud, Server, Database, Pencil
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  domain: string;
  vercel_project_id: string | null;
  sanity_project_id: string | null;
  sanity_dataset: string;
  supabase_project_ref: string | null;
  encrypted_resend_api_key?: string | null;
  created_at: string;
}

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form Fields - Projects
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  // Integration Toggles
  const [integrateVercel, setIntegrateVercel] = useState(false);
  const [integrateSanity, setIntegrateSanity] = useState(false);
  const [integrateSupabase, setIntegrateSupabase] = useState(false);
  const [integrateResend, setIntegrateResend] = useState(false);

  const [vercelProjectId, setVercelProjectId] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [sanityProjectId, setSanityProjectId] = useState("");
  const [sanityDataset, setSanityDataset] = useState("production");
  const [sanityToken, setSanityToken] = useState("");
  const [supabaseProjectRef, setSupabaseProjectRef] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load project list");
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const method = editingProject ? "PUT" : "POST";
      const bodyPayload: any = {
        name,
        domain,
        vercel_project_id: integrateVercel ? vercelProjectId : null,
        vercel_token: integrateVercel ? vercelToken : null,
        sanity_project_id: integrateSanity ? sanityProjectId : null,
        sanity_dataset: integrateSanity ? (sanityDataset || "production") : null,
        sanity_token: integrateSanity ? sanityToken : null,
        supabase_project_ref: integrateSupabase ? supabaseProjectRef : null,
        supabase_anon_key: integrateSupabase ? supabaseAnonKey : null,
        resend_api_key: integrateResend ? resendApiKey : null,
      };

      if (editingProject) {
        bodyPayload.id = editingProject.id;
      }

      const res = await fetch("/api/admin/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingProject ? "update" : "onboard"} project`);
      }

      setSuccess(
        editingProject
          ? `Project "${name}" has been successfully updated.`
          : `Project "${name}" has been successfully registered in the system.`
      );
      
      // Reset Form fields and edit mode
      setName("");
      setDomain("");
      setVercelProjectId("");
      setVercelToken("");
      setSanityProjectId("");
      setSanityDataset("production");
      setSanityToken("");
      setSupabaseProjectRef("");
      setSupabaseAnonKey("");
      setResendApiKey("");
      setIntegrateVercel(false);
      setIntegrateSanity(false);
      setIntegrateSupabase(false);
      setIntegrateResend(false);
      setEditingProject(null);
      
      // Refresh project list
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    setError(null);
    setSuccess(null);
    
    // Populate form fields
    setName(project.name);
    setDomain(project.domain);
    
    setVercelProjectId(project.vercel_project_id || "");
    setVercelToken("");
    setSanityProjectId(project.sanity_project_id || "");
    setSanityDataset(project.sanity_dataset || "production");
    setSanityToken("");
    setSupabaseProjectRef(project.supabase_project_ref || "");
    setSupabaseAnonKey("");
    setResendApiKey("");

    // Toggle service selection based on current fields
    setIntegrateVercel(!!project.vercel_project_id);
    setIntegrateSanity(!!project.sanity_project_id);
    setIntegrateSupabase(!!project.supabase_project_ref);
    setIntegrateResend(!!project.encrypted_resend_api_key);
  };

  const cancelEditing = () => {
    setEditingProject(null);
    setName("");
    setDomain("");
    setVercelProjectId("");
    setVercelToken("");
    setSanityProjectId("");
    setSanityDataset("production");
    setSanityToken("");
    setSupabaseProjectRef("");
    setSupabaseAnonKey("");
    setResendApiKey("");
    setIntegrateVercel(false);
    setIntegrateSanity(false);
    setIntegrateSupabase(false);
    setIntegrateResend(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }

      setSuccess("Project has been deleted successfully.");
      setDeletingId(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">
          Project Registration & Management
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Add new client projects, register domains, configure Vercel Web Analytics, and store CMS tokens.
        </p>
      </div>

      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        
        {/* Registration Form */}
        <section className="xl:col-span-2 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <FolderPlus className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              {editingProject ? `Edit Project: ${editingProject.name}` : "Onboard Client Site"}
            </h3>
          </div>

          <form onSubmit={handleOnboard} className="space-y-5">
            {/* Project details */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider">Core Parameters</h4>
              
              <div>
                <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Site Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Portfolio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Domain Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. acme.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Service Selection Toggles */}
            <div className="space-y-3 pt-4 border-t border-zinc-900/60">
              <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider">Services to Integrate</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIntegrateVercel(!integrateVercel)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    integrateVercel 
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={integrateVercel}
                    onChange={() => {}} // Controlled by button onClick
                    className="h-4 w-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500/40 bg-zinc-900 accent-indigo-600 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold font-display uppercase tracking-wide">Vercel</span>
                    <span className="block text-[10px] text-zinc-500 truncate">Web analytics & stats</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrateSanity(!integrateSanity)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    integrateSanity 
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={integrateSanity}
                    onChange={() => {}} // Controlled by button onClick
                    className="h-4 w-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500/40 bg-zinc-900 accent-indigo-600 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold font-display uppercase tracking-wide">Sanity</span>
                    <span className="block text-[10px] text-zinc-500 truncate">CMS dataset content</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrateSupabase(!integrateSupabase)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    integrateSupabase 
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={integrateSupabase}
                    onChange={() => {}} // Controlled by button onClick
                    className="h-4 w-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500/40 bg-zinc-900 accent-indigo-600 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold font-display uppercase tracking-wide">Supabase</span>
                    <span className="block text-[10px] text-zinc-500 truncate">PostgreSQL client database</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrateResend(!integrateResend)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    integrateResend 
                      ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" 
                      : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={integrateResend}
                    onChange={() => {}} // Controlled by button onClick
                    className="h-4 w-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500/40 bg-zinc-900 accent-indigo-600 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold font-display uppercase tracking-wide">Resend</span>
                    <span className="block text-[10px] text-zinc-500 truncate">Email notifications & delivery</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Vercel configurations */}
            {integrateVercel && (
              <div className="space-y-4 pt-4 border-t border-zinc-900/60 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5" /> Vercel Settings
                  </h4>
                  {vercelProjectId && vercelToken && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Vercel Project ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. prj_acme123"
                    value={vercelProjectId}
                    onChange={(e) => setVercelProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Vercel API Token (Management Key)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required={!editingProject}
                      placeholder={editingProject ? "Leave blank to keep existing key" : "Encrypted automatically in Postgres"}
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sanity CMS configurations */}
            {integrateSanity && (
              <div className="space-y-4 pt-4 border-t border-zinc-900/60 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" /> Sanity Settings
                  </h4>
                  {sanityProjectId && sanityToken && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Project ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sanity_acme"
                      value={sanityProjectId}
                      onChange={(e) => setSanityProjectId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Dataset</label>
                    <input
                      type="text"
                      required
                      placeholder="production"
                      value={sanityDataset}
                      onChange={(e) => setSanityDataset(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Sanity API Token (Read Token)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required={!editingProject}
                      placeholder={editingProject ? "Leave blank to keep existing key" : "Encrypted automatically in Postgres"}
                      value={sanityToken}
                      onChange={(e) => setSanityToken(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Supabase configurations */}
            {integrateSupabase && (
              <div className="space-y-4 pt-4 border-t border-zinc-900/60 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Supabase Settings
                  </h4>
                  {supabaseProjectRef && supabaseAnonKey && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Supabase Project Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. abcdefghijklmnopqrst"
                    value={supabaseProjectRef}
                    onChange={(e) => setSupabaseProjectRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Supabase Anon Key</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required={!editingProject}
                      placeholder={editingProject ? "Leave blank to keep existing key" : "Encrypted automatically in Postgres"}
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resend configurations */}
            {integrateResend && (
              <div className="space-y-4 pt-4 border-t border-zinc-900/60 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Resend Settings
                  </h4>
                  {resendApiKey && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Resend API Key</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required={!editingProject}
                      placeholder={editingProject ? "Leave blank to keep existing key" : "re_abcdef123..."}
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-950 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingProject ? "Save Project Details" : "Onboard Project"}
              </button>
              {editingProject && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-sm rounded-lg border border-zinc-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Project List Registry */}
        <section className="xl:col-span-3 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              Active Client Registry
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-24 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-24 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 text-sm gap-2">
              <Database className="h-10 w-10 text-zinc-700 mb-2" />
              <span>No client projects onboarded in this space.</span>
              <span>Use the onboarding form to configure your first node.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4.5">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-900 rounded-xl gap-4 hover:border-zinc-800 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className="font-bold text-zinc-100 font-display block text-sm truncate">
                      {project.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate">
                      <Globe className="h-3.5 w-3.5 text-zinc-600" />
                      {project.domain}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Calendar className="h-3 w-3" />
                      Registered {formatDistanceToNow(new Date(project.created_at))} ago
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t md:border-0 border-zinc-900 pt-3.5 md:pt-0">
                    <div className="flex items-center gap-2 flex-wrap max-w-[200px] justify-end">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        project.vercel_project_id 
                          ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10" 
                          : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                      }`}>
                        Vercel
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        project.sanity_project_id 
                          ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10" 
                          : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                      }`}>
                        Sanity
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        project.supabase_project_ref 
                          ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10" 
                          : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                      }`}>
                        Supabase
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        project.encrypted_resend_api_key 
                          ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10" 
                          : "bg-zinc-900 text-zinc-600 border border-zinc-900/60"
                      }`}>
                        Resend
                      </span>
                    </div>

                    {!deletingId && (
                      <button
                        onClick={() => startEditing(project)}
                        className="p-2 text-zinc-550 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-500/10"
                        title="Edit project"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                    )}

                    {deletingId === project.id ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] rounded-lg cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-[11px] rounded-lg cursor-pointer border border-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="p-2 text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                        title="Delete project"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
