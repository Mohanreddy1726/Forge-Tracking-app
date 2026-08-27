import { NextResponse, type NextRequest } from "next/server";

/*
 * Route guard — the equivalent of the original _authenticated layout.
 * Checks session-cookie presence (signature is verified server-side in
 * the API routes).
 */

const PROTECTED = [
  "/onboarding",
  "/dashboard",
  "/checkin",
  "/habits",
  "/workouts",
  "/cardio",
  "/nutrition",
  "/fasting",
  "/journal",
  "/photos",
  "/measurements",
  "/analytics",
  "/heatmap",
  "/calendar",
  "/reports",
  "/achievements",
  "/challenges",
  "/settings",
  "/export",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("forge_session")?.value);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (pathname === "/auth" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
