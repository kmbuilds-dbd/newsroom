import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Defense-in-depth auth check for API routes.
 * Returns null if authorized, or a 401 response.
 */
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  // Check extension API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.EXTENSION_API_KEY) {
    return null;
  }

  // Check session
  const session = await auth();
  if (session?.user) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
