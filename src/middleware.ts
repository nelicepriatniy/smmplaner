import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const loggedIn = !!request.auth;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (loggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!loggedIn) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    if (pathname.startsWith("/review/")) {
      return NextResponse.next();
    }
    if (
      pathname === "/api/uploads/view" ||
      pathname.startsWith("/api/uploads/view/")
    ) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/cron/")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Не гоняем auth для статики и публичных путей.
     * Иначе /uploads/…/*.bin|*.avif (и др.) попадают в middleware → гость получает редирект на /login,
     * а браузер в <img> подставляет HTML — «картинки не грузятся».
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/|review/|.*\\.(?:svg|ico|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
