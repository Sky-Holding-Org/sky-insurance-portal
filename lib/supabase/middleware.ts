import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Stale/invalid refresh token — clear the session cookie and treat as logged out
  if (authError?.code === "refresh_token_not_found") {
    await supabase.auth.signOut();
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isOpsRoute = request.nextUrl.pathname.startsWith("/operations");
  const isAnalyticsRoute = request.nextUrl.pathname.startsWith("/analytics");

  // If user is not logged in and trying to access a protected route (ops/analytics/sales)
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = user.user_metadata?.role || "sales";

    // Prevent authenticated users from visiting login page again
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = (role === "operation" || role === "super_admin") ? "/operations/cars" : "/sales";
      return NextResponse.redirect(url);
    }

    // Role-based protection: block "sales" role from operations
    if (isOpsRoute && role !== "operation" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/sales";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
