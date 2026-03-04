import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/api-auth";

const STORY_COLUMNS =
  "id, title, subtitle, event_query, status, category, tags, created_at, updated_at";

export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("stories")
      .select(STORY_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (q) {
      query = query.textSearch("search_vector", q, { type: "websearch" });
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ stories: data || [], total: count || 0 });
  } catch (error) {
    console.error("Stories fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
