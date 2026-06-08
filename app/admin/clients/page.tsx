"use client";

import React, { useState, useEffect } from "react";
import { 
  UserPlus, Mail, Key, Layers, Trash2, Users, 
  AlertCircle, CheckCircle2, Calendar, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface ClientProfile {
  id: string;
  full_name: string;
  email: string | null;
  project_id: string | null;
  project_name: string | null;
  updated_at: string;
}

export default function ClientAccountsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [assignedProjectId, setAssignedProjectId] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load projects");
      setProjects(data);
    } catch (err: any) {
      console.error(err.message || "Failed to fetch projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load clients");
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch client list");
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          project_id: assignedProjectId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard client");
      }

      setSuccess(`Client account for "${fullName}" has been successfully created.`);
      
      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setAssignedProjectId("");

      // Refresh list
      fetchClients();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during creation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/clients?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete client");
      }

      setSuccess("Client profile access revoked successfully.");
      setDeletingId(null);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">
          Client accounts
        </h2>
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
        
        {/* Creation Form */}
        <section className="xl:col-span-2 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              Onboard New Client
            </h3>
          </div>

          <form onSubmit={handleOnboardClient} className="space-y-5">
            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Assigned Project</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Layers className="h-4 w-4" />
                </div>
                <select
                  value={assignedProjectId}
                  onChange={(e) => setAssignedProjectId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">None (Unassigned / Restricted)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Onboarding..." : "Register Client Account"}
            </button>
          </form>
        </section>

        {/* Directory List */}
        <section className="xl:col-span-3 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Users className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              Registered Clients
            </h3>
          </div>

          {loadingClients ? (
            <div className="space-y-4">
              <div className="h-20 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-20 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-20 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 text-sm gap-2">
              <Users className="h-10 w-10 text-zinc-700 mb-2" />
              <span>No client users registered.</span>
              <span>Use the onboarding form to create client accounts.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {clients.map((client) => (
                <div 
                  key={client.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl gap-4 hover:border-zinc-800 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100 font-display block text-sm truncate">
                        {client.full_name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-900 text-zinc-500 border border-zinc-900/80">
                        <Shield className="h-2.5 w-2.5 text-zinc-500" />
                        Client
                      </span>
                    </div>
                    <span className="block text-xs text-zinc-400 font-medium truncate">
                      {client.email || "No email"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Calendar className="h-3 w-3" />
                      Updated {formatDistanceToNow(new Date(client.updated_at))} ago
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-zinc-900/60 pt-3 sm:pt-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-600 uppercase font-semibold tracking-wider mb-0.5">Assigned Project</span>
                      {client.project_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
                          <Layers className="h-3.5 w-3.5 text-indigo-400" />
                          {client.project_name || "Assigned Project"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-zinc-600 border border-zinc-800">
                          Restricted / Unassigned
                        </span>
                      )}
                    </div>

                    {deletingId === client.id ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] rounded-lg cursor-pointer"
                        >
                          Revoke
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
                        onClick={() => setDeletingId(client.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                        title="Revoke client access"
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
