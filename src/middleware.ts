import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { rateLimit, AUTH_RATE_LIMIT } from "./lib/utils/rate-limit";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth")) {
    const isLocalhost = request.headers.get("host")?.includes("localhost");
    if (!isLocalhost) {
      const limited = rateLimit(request, AUTH_RATE_LIMIT);
      if (limited) return limited;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
