"use client";

import React, { useState, useEffect } from "react";
import { 
  UserPlus, Mail, Trash2, Users, Shield, 
  AlertCircle, CheckCircle2, Calendar, ClipboardCheck, Clipboard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  updated_at: string;
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Invitation Link state
  const [invitedLink, setInvitedLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Read current user session info from cookie to prevent self-deletion UI actions
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find(c => c.trim().startsWith("dashboard-session="));
    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        setCurrentUserEmail(parsed.email);
      } catch (e) {
        console.error("Failed to parse session cookie:", e);
      }
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admin list");
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch administrators");
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setInvitedLink(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate invitation");
      }

      setSuccess(`Admin invitation generated successfully.`);
      setInvitedLink(data.onboardingLink);
      setEmail("");
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during creation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/admins?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke admin account");
      }

      setSuccess("Admin access revoked successfully.");
      setDeletingId(null);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || "Failed to revoke admin account");
    }
  };

  const handleCopyLink = () => {
    if (invitedLink) {
      navigator.clipboard.writeText(invitedLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight">
          Admin Accounts
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

      {/* Copy link drawer */}
      {invitedLink && (
        <div className="rounded-2xl bg-indigo-600/10 border border-indigo-500/20 p-6 space-y-4.5 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400 animate-pulse" />
              <h4 className="text-sm font-bold font-display text-indigo-200 uppercase tracking-wider">
                Invitation Generated
              </h4>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              {copySuccess ? (
                <>
                  <ClipboardCheck className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" /> Copy Invitation Link
                </>
              )}
            </button>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 font-mono text-xs text-indigo-200/90 break-all select-all leading-relaxed">
            {invitedLink}
          </div>
          <p className="text-xs text-zinc-500">
            Share this link with the invited person. They will be directed to set their password and complete their profile registration. This token will automatically expire in 24 hours.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        
        {/* Creation Form */}
        <section className="xl:col-span-2 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <UserPlus className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              Invite Administrator
            </h3>
          </div>

          <form onSubmit={handleInviteAdmin} className="space-y-5">
            <div>
              <label className="block text-xs text-zinc-500 font-medium mb-1.5 uppercase">Admin Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Generating Link..." : "Generate Invitation"}
            </button>
          </form>
        </section>

        {/* Directory List */}
        <section className="xl:col-span-3 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Users className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider">
              Active Administrators
            </h3>
          </div>

          {loadingAdmins ? (
            <div className="space-y-4">
              <div className="h-20 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
              <div className="h-20 bg-zinc-950 border border-zinc-900/60 rounded-xl animate-pulse" />
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 text-sm gap-2">
              <Users className="h-10 w-10 text-zinc-700 mb-2" />
              <span>No admins registered.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {admins.map((admin) => {
                const isSelf = currentUserEmail && admin.email && admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <div 
                    key={admin.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl gap-4 hover:border-zinc-800 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 font-display block text-sm truncate">
                          {admin.full_name || "Pending Onboarding"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                          <Shield className="h-2.5 w-2.5 text-indigo-400" />
                          System Admin
                        </span>
                        {isSelf && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Logged In (You)
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-zinc-400 font-medium truncate">
                        {admin.email || "No email"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <Calendar className="h-3 w-3" />
                        Updated {formatDistanceToNow(new Date(admin.updated_at))} ago
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 border-zinc-900/60 pt-3 sm:pt-0">
                      {isSelf ? (
                        <span className="text-[10px] text-zinc-500 font-medium italic select-none">
                          Protected Active User
                        </span>
                      ) : deletingId === admin.id ? (
                        <div className="flex items-center gap-1 animate-fade-in">
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
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
                          onClick={() => setDeletingId(admin.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-500/10"
                          title="Revoke admin access"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
