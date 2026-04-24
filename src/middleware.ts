import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PANEL_SESSION_COOKIE,
  verifyPanelSessionValue,
} from "@/lib/panelSession";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(PANEL_SESSION_COOKIE)?.value;
  const session = await verifyPanelSessionValue(token);

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isLoginApi =
    pathname === "/api/auth/login" && request.method === "POST";

  if (session) {
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
