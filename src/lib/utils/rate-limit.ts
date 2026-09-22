import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const key = `${request.nextUrl.pathname}:${ip}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  record.count += 1;

  if (record.count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
        },
      }
    );
  }

  return null;
}

export const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
export const CHECKOUT_RATE_LIMIT = { limit: 5, windowMs: 60_000 };
export const API_RATE_LIMIT = { limit: 60, windowMs: 60_000 };
