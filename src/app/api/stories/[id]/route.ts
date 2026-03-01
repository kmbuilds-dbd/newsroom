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
    .order("date_sort", { ascending: true });

  if (devError) {
    return NextResponse.json(
      { error: "Failed to fetch developments" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...story, developments });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify story exists
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id")
    .eq("id", id)
    .single();

  if (storyError || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  // Delete developments first (child records)
  const { error: devError } = await supabase
    .from("developments")
    .delete()
    .eq("story_id", id);

  if (devError) {
    return NextResponse.json(
      { error: `Failed to delete developments: ${devError.message}` },
      { status: 500 }
    );
  }

  // Delete the story
  const { error: deleteError } = await supabase
    .from("stories")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete story: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
