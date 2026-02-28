import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (storyError || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const { data: developments, error: devError } = await supabase
    .from("developments")
    .select("*")
    .eq("story_id", id)
    .order("position", { ascending: true });

  if (devError) {
    return NextResponse.json(
      { error: "Failed to fetch developments" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...story, developments });
}
