"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Activity, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if session or recovery tokens are present in hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const isDemo = !supabase;

      if (!isDemo && (!hash || !hash.includes("access_token="))) {
        // Direct access without recovery tokens
        console.warn("Direct access to reset-password page without token hash.");
      }
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        // Demo Mode mock success
        console.log("Demo Mode: Resetting password to:", password);
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        setSuccess(true);
        // Log out user to force them to sign in with new credentials
        await supabase.auth.signOut();
        
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while updating your password.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md animate-fade-in z-10">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/25 mb-4 text-indigo-400">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Zedbe Projects
          </h1>
        </div>

        {/* Form card */}
        <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-100 mb-6 font-display">
            Create New Password
          </h2>

          {success ? (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-bold text-zinc-100">Password Reset Complete</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your password has been successfully updated. Redirecting you to the sign in page...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 animate-fade-in flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="pass" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-pass" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="confirm-pass"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Save Password & Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
