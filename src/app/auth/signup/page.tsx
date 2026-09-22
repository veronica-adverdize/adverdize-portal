"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `http://localhost:3000/auth/login`,
        data: {
          full_name: formData.full_name,
          company_name: formData.company_name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 mb-6">
          We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>. Click the link to activate your account.
        </p>
        <Link href="/auth/login" className="btn-outline w-full">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">
        Request access
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Create your Adverdize client account
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            name="full_name"
            className="input"
            placeholder="Jane Smith"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">Company name</label>
          <input
            type="text"
            name="company_name"
            className="input"
            placeholder="Acme Pte Ltd"
            value={formData.company_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">Work email</label>
          <input
            type="email"
            name="email"
            className="input"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            name="password"
            className="input"
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            name="confirm_password"
            className="input"
            placeholder="Repeat password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand-pink font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
