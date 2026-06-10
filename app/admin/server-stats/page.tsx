"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Server, Cpu, HardDrive, Thermometer, Clock, 
  RefreshCw, Wifi, WifiOff, ExternalLink, ShieldCheck 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts";

interface PiStat {
  id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  uptime: string;
  created_at: string;
}

export default function ServerStatsPage() {
  const [latest, setLatest] = useState<PiStat | null>(null);
  const [history, setHistory] = useState<PiStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedOfflineOverlay, setDismissedOfflineOverlay] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);
    try {
      const res = await fetch("/api/admin/server-stats");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load server statistics");
      }
      setLatest(json.latest);
      setHistory(json.history || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading server statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto refresh telemetry stats every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchStats(true);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Determine online/offline status based on last ping time (threshold 2 minutes - two ping times)
  const isOnline = latest ? (Date.now() - new Date(latest.created_at).getTime() < 2 * 60 * 1000) : false;

  // Reset dismissed state if server goes back online
  useEffect(() => {
    if (isOnline) {
      setDismissedOfflineOverlay(false);
    }
  }, [isOnline]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-zinc-950 border border-zinc-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight">
              Raspberry Pi Telemetry
            </h2>
            {latest ? (
              isOnline ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Wifi className="h-3.5 w-3.5" />
                  Live / Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                  <WifiOff className="h-3.5 w-3.5" />
                  Offline / Idle
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                <WifiOff className="h-3.5 w-3.5" />
                No Data Reported
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time hardware telemetry streams reported directly from your home Raspberry Pi server.
          </p>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          <span>{refreshing ? "Syncing..." : "Sync Stats"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3 animate-fade-in">
          <WifiOff className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {latest ? (
        <div className="relative space-y-8">
          {/* Overlay when offline and not dismissed */}
          {!isOnline && !dismissedOfflineOverlay && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-md bg-zinc-950/70 rounded-2xl border border-zinc-900/60 p-6 text-center animate-fade-in min-h-[500px]">
              <div className="max-w-md space-y-5 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                  <WifiOff className="h-7 w-7 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-100">Server Connection Lost</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    The Raspberry Pi server is currently offline or idle. No telemetry data has been received in the last 2 minutes.
                  </p>
                </div>
                <button
                  onClick={() => setDismissedOfflineOverlay(true)}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-sm font-semibold rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Dismiss & View Cached Data
                </button>
              </div>
            </div>
          )}

          {/* Metrics Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CPU Metric Card */}
            <div className="glass-panel border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-850 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">CPU Load</span>
                <Cpu className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-display text-zinc-100">{latest.cpu_usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${latest.cpu_usage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="glass-panel border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-850 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Memory Consumption</span>
                <Server className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-display text-zinc-100">{latest.memory_usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${latest.memory_usage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Disk Space Card */}
            <div className="glass-panel border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-850 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Disk Storage Space</span>
                <HardDrive className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-display text-zinc-100">{latest.disk_usage}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${latest.disk_usage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CPU Temp Card */}
            <div className="glass-panel border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-850 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">CPU Temp Zone</span>
                <Thermometer className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold font-display text-zinc-100">{latest.temperature}°C</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((latest.temperature / 90) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Charts view row */}
          {history.length > 0 && (
            <section className="glass-panel border border-zinc-900 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                Hardware Telemetry History Trend (Last 24 Hours)
              </h3>
              
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.map(item => ({
                    ...item,
                    timeLabel: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }))}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="timeLabel" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "8px", color: "#f4f4f5" }}
                    />
                    <Area type="monotone" name="CPU Usage %" dataKey="cpu_usage" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                    <Area type="monotone" name="Temp °C" dataKey="temperature" stroke="#f43f5e" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Uptime and details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel border border-zinc-900 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                Uptime status
              </h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-indigo-400">
                  <Clock className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs text-zinc-550 uppercase font-semibold">Active Server Uptime</span>
                  <span className="block text-lg font-bold text-zinc-100">{latest.uptime}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-550 pt-2 border-t border-zinc-900/50 leading-relaxed">
                Last ping received: {formatDistanceToNow(new Date(latest.created_at))} ago ({new Date(latest.created_at).toLocaleString()})
              </p>
            </div>

            <div className="glass-panel border border-zinc-900 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold font-display text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  Raspberry Pi Node Config
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your home server uploads CPU, memory, temperature, and storage metrics to this website securely.
                </p>
              </div>
              
              <div className="bg-zinc-950 border border-zinc-905 p-3 rounded-lg flex items-center justify-between text-xs text-zinc-500 font-mono">
                <span>Webhook Active</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel border border-zinc-900 rounded-2xl p-10 text-center space-y-4">
          <Server className="h-12 w-12 text-zinc-750 mx-auto" />
          <h3 className="text-lg font-semibold text-zinc-200">No Telemetry Recorded Yet</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Your home server has not reported any metrics yet. Start the stats.py reporting script on your Raspberry Pi to initiate real-time logging.
          </p>
        </div>
      )}
    </div>
  );
}
