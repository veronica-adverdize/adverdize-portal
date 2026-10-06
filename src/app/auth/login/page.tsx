"use client";

// import { useState, useEffect } from "react";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// export default function LoginPage() {
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [airwallexLoading, setAirwallexLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pick up error from OAuth redirects (e.g. Airwallex)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(urlError);
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-1.5">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">
          Sign in to your Adverdize client portal
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <circle cx="7" cy="7" r="6" stroke="#E8405A" strokeWidth="1.5" />
            <path d="M7 4v3.5M7 9.5v.5" stroke="#E8405A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* SSO buttons */}
      <div className="space-y-2.5 mb-5">
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </button>

      <button
        onClick={() => {
          setAirwallexLoading(true);
          setError("");
          window.location.href = "/api/auth/airwallex";
        }}
        disabled={airwallexLoading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {airwallexLoading ? (
          <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg width="36" height="18" viewBox="0 0 24 24" fill="none" aria-label="Airwallex"><defs data-dc-tpl="13"><linearGradient data-dc-tpl="14" x1="0%" y1="0%" x2="100%" y2="100%" id="awx-hdr"><stop data-dc-tpl="15" offset="0%" stop-color="#FF4244"></stop><stop data-dc-tpl="16" offset="100%" stop-color="#FF8E3C"></stop></linearGradient></defs><path data-dc-tpl="18" d="M34.614 9.421a4.452 4.452 0 0 1 1.057 4.77l-2.347 6.376c-.616 1.674-2.02 2.969-3.755 3.307a4.882 4.882 0 0 1-4.732-1.69L10.763 5.322a.31.31 0 0 0-.528.093L5.656 17.8c-.095.256.157.504.407.402l5.619-2.295a2.481 2.481 0 0 1 3.296 1.546c.415 1.273-.283 2.648-1.512 3.15L6.126 23.6c-1.359.555-2.92.457-4.144-.36a4.461 4.461 0 0 1-1.704-5.26l5.41-14.628C6.329 1.618 7.789.394 9.594.078a5.025 5.025 0 0 1 4.768 1.755l8.078 9.68 7.43-3.035c1.651-.674 3.469-.313 4.744.943zm-4.285 4.862c.094-.256-.158-.504-.408-.401l-4.105 1.676 2.462 2.951a.31.31 0 0 0 .53-.093l1.52-4.133z" fill="url(#awx-hdr)"></path></svg>
          // <img src="/logos/airwallex.png" alt="Airwallex" className="w-4 h-4 object-contain" />
        )}
        {airwallexLoading ? "Redirecting..." : "Continue with Airwallex"}
      </button>
      </div>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400">or continue with email</span>
        </div>
      </div>

      {/* Email/password form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-600">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-brand-pink hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="input pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-brand-pink font-medium hover:underline">
          Request access
        </Link>
      </p>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 rounded-full border-2 border-brand-pink border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}