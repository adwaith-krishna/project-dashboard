"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  RefreshCw, Cloud, Server, LayoutGrid, Terminal, Globe, 
  CheckCircle2, XCircle, AlertCircle, Calendar, User, GitBranch, GitCommit,
  ArrowLeft, BarChart3
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ClientPortalDashboard from "@/components/ClientPortalDashboard";

interface Project {
  id: string;
  name: string;
  domain: string;
  vercel_project_id: string | null;
  sanity_project_id: string | null;
  sanity_dataset: string;
}

interface AnalyticsEvent {
  id: string;
  path: string;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  timestamp: string;
}

interface AdminDashboardClientProps {
  projectId: string;
  hasServerStatsAccess: boolean;
  initialProject: Project;
  events: AnalyticsEvent[];
}

export default function AdminDashboardClient({ 
  projectId, 
  hasServerStatsAccess,
  initialProject,
  events 
}: AdminDashboardClientProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"quotas" | "analytics">(
    hasServerStatsAccess ? "quotas" : "analytics"
  );

  const fetchStats = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const res = await fetch(`/api/admin/proxy-stats?project_id=${projectId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load telemetry stats");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (hasServerStatsAccess) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [projectId, hasServerStatsAccess]);

  // Render Skeleton Loaders
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-96 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
        </div>
        
        <div className="h-64 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel border border-red-500/20 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 animate-fade-in">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Sync Telemetry Failed</h3>
        <p className="text-sm text-zinc-400 mb-6">{error || "Could not retrieve project data"}</p>
        <button
          onClick={() => fetchStats(false)}
          className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { vercel, sanity } = data;

  const vercelBwPercent = Math.min((vercel.quota.bandwidthUsedGb / vercel.quota.bandwidthLimitGb) * 100, 100);
  const vercelTimePercent = Math.min((vercel.quota.serverlessTimeSeconds / vercel.quota.serverlessLimitSeconds) * 100, 100);

  const sanityDocPercent = Math.min((sanity.quota.documentsUsed / sanity.quota.documentsLimit) * 100, 100);
  const sanityAssetPercent = Math.min((sanity.quota.assetsUsedMb / sanity.quota.assetsLimitMb) * 100, 100);
  const sanityApiPercent = Math.min((sanity.quota.apiRequestsUsed / sanity.quota.apiRequestsLimit) * 100, 100);

  const recentEvents = events.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Navigation */}
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-550 hover:text-indigo-400 transition-colors uppercase tracking-wider group cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-zinc-500 group-hover:text-indigo-450" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight">
              {data.projectName}
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 font-medium">
            <Globe className="h-4 w-4 text-zinc-500" />
            <a href={`https://${data.domain}`} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
              {data.domain}
            </a>
          </div>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={syncing}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-indigo-400" : ""}`} />
          <span>{syncing ? "Syncing API..." : "Force API Sync"}</span>
        </button>
      </div>

      {/* Tab Selection Bar */}
      {hasServerStatsAccess && (
        <div className="flex border-b border-zinc-900 pb-px gap-6 mb-2">
          <button
            onClick={() => setActiveTab("quotas")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "quotas"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-350"
            }`}
          >
            <Server className="h-4 w-4" />
            Infrastructure Quotas
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "analytics"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-355"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Client Traffic Report
          </button>
        </div>
      )}

      {activeTab === "quotas" ? (
        <>
          {/* Integration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* VERCEL PANEL */}
            <section className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900/80 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-white">
                      <Cloud className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-display text-zinc-200">Vercel Serverless Hosting</h3>
                      <span className="text-[10px] text-zinc-500">ID: {vercel.vercelProjectId}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase">
                    {vercel.status}
                  </span>
                </div>

                {/* Quotas */}
                <div className="space-y-5">
                  {/* Bandwidth */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Edge Network Bandwidth</span>
                      <span className="text-zinc-200 font-semibold">
                        {vercel.quota.bandwidthUsedGb.toFixed(1)} GB / {vercel.quota.bandwidthLimitGb} GB
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                        style={{ width: `${vercelBwPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Serverless Execution Time */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Serverless Execution Duration</span>
                      <span className="text-zinc-200 font-semibold">
                        {vercel.quota.serverlessTimeSeconds}s / {vercel.quota.serverlessLimitSeconds}s
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                        style={{ width: `${vercelTimePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick status */}
              <div className="mt-8 pt-4 border-t border-zinc-900/50 flex justify-between text-[11px] text-zinc-500">
                <span>Edge Location: Global Anycast</span>
                <span>Monthly Billing Scope</span>
              </div>
            </section>

            {/* SANITY PANEL */}
            <section className="glass-panel rounded-2xl border border-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900/80 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-white">
                      <Server className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-display text-zinc-200">Sanity Studio CMS</h3>
                      <span className="text-[10px] text-zinc-500">ID: {sanity.sanityProjectId}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/20 border border-indigo-900/30 text-indigo-400">
                    Dataset: {sanity.dataset}
                  </span>
                </div>

                {/* Quotas */}
                <div className="space-y-5">
                  {/* Documents Limit */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Document Quota</span>
                      <span className="text-zinc-200 font-semibold">
                        {sanity.quota.documentsUsed.toLocaleString()} / {sanity.quota.documentsLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                        style={{ width: `${sanityDocPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Asset storage */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>Asset Storage Footprint</span>
                      <span className="text-zinc-200 font-semibold">
                        {sanity.quota.assetsUsedMb} MB / {sanity.quota.assetsLimitMb} MB
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                        style={{ width: `${sanityAssetPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* API Requests */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 font-medium mb-2">
                      <span>API Quotas (Monthly Requests)</span>
                      <span className="text-zinc-200 font-semibold">
                        {sanity.quota.apiRequestsUsed.toLocaleString()} / {sanity.quota.apiRequestsLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500" 
                        style={{ width: `${sanityApiPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-900/50 flex justify-between text-[11px] text-zinc-500">
                <span>CDN API Cache: Active</span>
                <span>Plan Tier: Custom Dev</span>
              </div>
            </section>
          </div>

          {/* Deployment & Logs Split Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Deployments Timeline */}
            <section className="lg:col-span-2 glass-panel border border-zinc-900 rounded-2xl p-6">
              <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-indigo-400" />
                Recent Production Deployments
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-medium pb-2 uppercase tracking-wide">
                      <th className="py-2.5 font-semibold">Deploy URL / Branch</th>
                      <th className="py-2.5 font-semibold">Commit Message</th>
                      <th className="py-2.5 font-semibold">Deployment Date</th>
                      <th className="py-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/40">
                    {vercel.deployments.map((d: any) => {
                      const isReady = d.status === "READY";
                      const isError = d.status === "ERROR";
                      return (
                        <tr key={d.id} className="hover:bg-zinc-950/20 text-zinc-300">
                          <td className="py-3">
                            <a 
                              href={`https://${d.url}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-medium text-zinc-100 hover:text-indigo-400 hover:underline transition-colors block max-w-[200px] truncate"
                            >
                              {d.url}
                            </a>
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                              <GitBranch className="h-3 w-3" />
                              {d.branch}
                            </span>
                          </td>
                          <td className="py-3 max-w-[220px] truncate">
                            <span className="font-normal text-zinc-300">{d.commit}</span>
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                              <User className="h-3 w-3" />
                              {d.creator}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                              {formatDistanceToNow(new Date(d.date))} ago
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isReady 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                : isError 
                                ? "bg-red-500/10 text-red-400 border border-red-500/15"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                            }`}>
                              {isReady ? <CheckCircle2 className="h-3 w-3" /> : isError ? <XCircle className="h-3 w-3" /> : null}
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Webhook Stream logs */}
            <section className="glass-panel border border-zinc-900 rounded-2xl p-6">
              <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                Telemetry Logs Stream
              </h3>

              {recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 text-xs gap-2">
                  <AlertCircle className="h-8 w-8 text-zinc-600" />
                  <span>No telemetry logged yet.</span>
                  <span>Point a Vercel log drain webhook to the destination.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((evt) => (
                    <div 
                      key={evt.id} 
                      className="flex flex-col p-3 rounded-lg bg-zinc-950 border border-zinc-900/60 font-mono text-[11px] leading-normal"
                    >
                      <div className="flex justify-between items-center text-zinc-500 mb-1">
                        <span className="text-indigo-400 font-semibold">{evt.country || "US"}</span>
                        <span>{formatDistanceToNow(new Date(evt.timestamp))} ago</span>
                      </div>
                      <div className="text-zinc-200 truncate">
                        <span className="text-zinc-500">GET</span> {evt.path}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-900/50">
                        <span>{evt.browser || "Chrome"} / {evt.os || "OS"}</span>
                        <span className="max-w-[100px] truncate text-right">Ref: {evt.referrer ? evt.referrer.replace('https://', '') : 'Direct'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6">
          <ClientPortalDashboard
            projectName={initialProject.name}
            domain={initialProject.domain}
            events={events}
          />
        </div>
      )}
    </div>
  );
}
