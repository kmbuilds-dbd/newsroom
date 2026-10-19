import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow PWA install assets without a session — the browser fetches
  // the manifest and icons when the user adds the app to the home screen.
  if (
    pathname === "/manifest.json" ||
    pathname === "/icon-192.png" ||
    pathname === "/icon-512.png" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Allow auth routes and sign-in page
  if (pathname.startsWith("/api/auth") || pathname === "/sign-in") {
    return NextResponse.next();
  }

  // Allow API routes with a valid extension API key
  if (pathname.startsWith("/api/")) {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey && apiKey === process.env.EXTENSION_API_KEY) {
      return NextResponse.next();
    }
  }

  // Redirect unauthenticated requests to sign-in
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
