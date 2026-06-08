"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, CheckCircle2, AlertCircle, Shield, Activity, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  // Verification states
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // Signup form states
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      
      if (!tokenParam) {
        setVerificationError("Missing invitation token. Please request a new invitation link from your administrator.");
        setVerifying(false);
        return;
      }
      
      setToken(tokenParam);
      verifyToken(tokenParam);
    }
  }, []);

  const verifyToken = async (tokenString: string) => {
    try {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenString }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Token verification failed");
      }

      setEmail(data.email);
      setRole(data.role);
    } catch (err: any) {
      setVerificationError(err.message || "Failed to verify invitation link. It may be expired or corrupt.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);
    setSignupError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete signup");
      }

      setSignupSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setSignupError(err.message || "An unexpected error occurred during signup");
      setSigningUp(false);
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
            Apex Analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Project Maintenance & Telemetry Control Panel
          </p>
        </div>

        <div className="glass-panel rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 border border-zinc-800">
          
          {verifying ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">Verifying invitation token...</p>
            </div>
          ) : verificationError ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{verificationError}</span>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition-all border border-zinc-800 cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          ) : signupSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25 mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white font-display">Account Created!</h2>
              <p className="text-sm text-zinc-400">
                Welcome to Zedbe Projects. You have successfully completed your profile. Redirecting to login...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 font-display">
                  Complete Admin Registration
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  You are completing sign up for an administrator account.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4.5">
                {signupError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="block w-full pl-10 pr-3 py-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-500 text-sm cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Choose Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signingUp}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
                >
                  {signingUp ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Register Account <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
