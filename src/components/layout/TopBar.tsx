"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Settings,
  Search,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface TopBarProps {
  user?: {
    full_name?: string;
    email?: string;
    role?: string;
    organisation?: { name?: string };
  } | null;
}

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}


export default function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchResults]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function navigateTo(href: string) {
    setShowResults(false);
    setSearchQuery("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateTo(results[activeIndex].href);
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div ref={searchRef} className="relative w-72">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#E05C83] focus-within:ring-2 focus-within:ring-[#E05C83]/10 transition-all">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#E05C83] rounded-full animate-spin shrink-0" />
          )}
        </div>

        {/* Results dropdown */}
        {showResults && (
          <div className="absolute left-0 top-full mt-1 w-full max-h-80 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-lg z-50">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Search size={20} className="text-gray-200 mx-auto mb-1.5" />
                <p className="text-sm text-gray-400">No results found</p>
              </div>
            ) : (
              <div className="py-1">
                {results.map((r, i) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => navigateTo(r.href)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                        i === activeIndex
                          ? "bg-[#E05C83]/5"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                        {r.title}
                      </p>
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                    </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{
                background: "linear-gradient(135deg, #E05C83, #F4845F)",
              }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.full_name ?? "User"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.organisation?.name}
              </p>
            </div>
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
