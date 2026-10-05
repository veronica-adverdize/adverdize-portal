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
          <svg className="h-4 object-contain"  width="auto" height="40" viewBox="0 0 175 24" fill="none" aria-label="Airwallex"><defs data-dc-tpl="13"><linearGradient data-dc-tpl="14" x1="0%" y1="0%" x2="100%" y2="100%" id="awx-hdr"><stop data-dc-tpl="15" offset="0%" stop-color="#FF4244"></stop><stop data-dc-tpl="16" offset="100%" stop-color="#FF8E3C"></stop></linearGradient></defs><path data-dc-tpl="17" d="M150.743 11.045c2.213 0 3.066 1.354 3.185 2.533a.128.128 0 0 1-.128.14h-6.077a.128.128 0 0 1-.127-.144c.164-1.152 1.185-2.529 3.147-2.529zm3.331 7.496a.254.254 0 0 0-.207.105c-.548.772-1.44 1.248-2.772 1.248-1.835 0-3.428-1.206-3.6-2.915a.128.128 0 0 1 .127-.14h10.919c.031-.096.095-.828.095-1.497 0-5.092-3.036-8.116-7.957-8.116-4.122 0-7.925 3.246-7.925 8.339 0 5.316 3.899 8.435 8.277 8.435 3.957 0 6.464-2.214 7.277-4.89.005-.016.032-.116.062-.262a.255.255 0 0 0-.25-.307h-4.046zm9.655-3.057l-5.177-7.38a.255.255 0 0 1 .21-.401h5.09c.087 0 .167.043.215.115l2.66 4.05c.05.077.164.076.214-.002l2.599-4.045a.255.255 0 0 1 .215-.118h4.798c.208 0 .329.233.21.402l-5.108 7.186a.254.254 0 0 0-.001.293c1.672 2.38 3.583 5.13 5.298 7.537.12.169 0 .401-.208.401h-5.055a.256.256 0 0 1-.214-.114l-2.758-4.182a.128.128 0 0 0-.213 0c-.826 1.228-1.906 2.938-2.725 4.182a.255.255 0 0 1-.214.114h-4.712a.254.254 0 0 1-.21-.399l5.087-7.349a.254.254 0 0 0 0-.29zm-27.43 7.784V.733c0-.141.115-.255.256-.255h4.346c.141 0 .256.114.256.255v22.535c0 .14-.115.254-.256.254h-4.346a.255.255 0 0 1-.256-.254zm-7.158 0V.733c0-.141.115-.255.256-.255h4.346c.141 0 .255.114.255.255v22.535c0 .14-.114.254-.255.254h-4.346a.255.255 0 0 1-.256-.254zm-10.748-3.47c1.95 0 3.611-1.527 3.611-4.201 0-2.737-1.63-4.17-3.611-4.17-2.077 0-3.643 1.433-3.643 4.17 0 2.61 1.63 4.202 3.643 4.202zm3.643 1.687c-.703 1.528-2.3 2.483-4.282 2.483-4.666 0-7.893-3.533-7.893-8.403 0-4.71 3.036-8.34 7.733-8.34 2.844 0 4.09 1.56 4.41 2.292v-1.56c0-.14.114-.254.256-.254h4.186c.14 0 .255.114.255.255v15.31c0 .14-.114.254-.255.254h-4.183a.255.255 0 0 1-.255-.258c.008-.575.028-1.904.028-1.779zM99.496 7.878l2.911 8.818c.04.12.21.116.244-.005l2.487-8.802a.255.255 0 0 1 .246-.186h4.22c.173 0 .296.166.245.33l-4.763 15.31a.255.255 0 0 1-.244.18h-4.453a.256.256 0 0 1-.242-.174l-3.27-9.682c-.04-.116-.205-.115-.243 0l-3.21 9.68a.255.255 0 0 1-.242.175h-4.549a.256.256 0 0 1-.244-.178l-4.825-15.31a.255.255 0 0 1 .244-.331h4.508c.114 0 .215.076.246.186l2.487 8.774c.034.12.204.124.244.005l2.942-8.79a.256.256 0 0 1 .243-.175h4.775c.11 0 .209.07.243.175zm-17.25 4.287a.255.255 0 0 1-.299.251 7.027 7.027 0 0 0-1.235-.098c-1.95 0-3.707 1.146-3.707 4.297v6.653c0 .14-.114.254-.255.254h-4.346a.255.255 0 0 1-.256-.254V7.958c0-.14.114-.255.256-.255h4.186c.141 0 .255.114.255.255v1.878c.831-1.783 2.845-2.292 4.123-2.292.388 0 .776.042 1.079.108.117.026.199.13.199.249v4.264zM64.894 23.268V7.958c0-.14.115-.255.256-.255h4.346c.141 0 .256.114.256.255v15.31c0 .14-.115.254-.256.254H65.15a.255.255 0 0 1-.256-.254zM67.291.032c1.598 0 2.876 1.273 2.876 2.833 0 1.56-1.278 2.833-2.876 2.833-1.534 0-2.812-1.273-2.812-2.833 0-1.56 1.278-2.833 2.812-2.833zM49.417 14.355h5.136c.088 0 .15-.086.12-.169L52.137 6.9a.128.128 0 0 0-.242-.001l-2.597 7.287c-.03.082.032.17.12.17zm6.733 4.584h-8.395a.255.255 0 0 0-.24.17l-1.51 4.244a.255.255 0 0 1-.241.17H41.01a.255.255 0 0 1-.24-.345L49.11 1.12a.255.255 0 0 1 .239-.165h5.494c.106 0 .202.066.239.166l8.246 22.058a.255.255 0 0 1-.24.343h-4.947a.256.256 0 0 1-.241-.17l-1.51-4.243a.256.256 0 0 0-.24-.17z" fill="#0A0E17"></path><path data-dc-tpl="18" d="M34.614 9.421a4.452 4.452 0 0 1 1.057 4.77l-2.347 6.376c-.616 1.674-2.02 2.969-3.755 3.307a4.882 4.882 0 0 1-4.732-1.69L10.763 5.322a.31.31 0 0 0-.528.093L5.656 17.8c-.095.256.157.504.407.402l5.619-2.295a2.481 2.481 0 0 1 3.296 1.546c.415 1.273-.283 2.648-1.512 3.15L6.126 23.6c-1.359.555-2.92.457-4.144-.36a4.461 4.461 0 0 1-1.704-5.26l5.41-14.628C6.329 1.618 7.789.394 9.594.078a5.025 5.025 0 0 1 4.768 1.755l8.078 9.68 7.43-3.035c1.651-.674 3.469-.313 4.744.943zm-4.285 4.862c.094-.256-.158-.504-.408-.401l-4.105 1.676 2.462 2.951a.31.31 0 0 0 .53-.093l1.52-4.133z" fill="url(#awx-hdr)"></path></svg>
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