import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTimeline } from "@/lib/anthropic";
import { STORY_CATEGORIES, StoryCategory } from "@/lib/types";
import { requireAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  const { id } = await params;

  // Get existing story to retrieve the event_query
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("event_query")
    .eq("id", id)
    .single();

  if (storyError || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  try {
    const timeline = await generateTimeline(story.event_query);

    // Derive actor tags from source labels and merge with AI-generated tags
    const actorTags = [
      ...new Set(
        timeline.developments.map((d) => d.source_label.toLowerCase())
      ),
    ];
    const allTags = [...new Set([...(timeline.tags || []), ...actorTags])];

    // Validate category
    const category =
      timeline.category &&
      STORY_CATEGORIES.includes(timeline.category as StoryCategory)
        ? timeline.category
        : null;

    // Update story metadata
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        title: timeline.title,
        subtitle: timeline.subtitle,
        status: timeline.status,
        category,
        tags: allTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update story: ${updateError.message}`);
    }

    // Delete old developments
    const { error: deleteError } = await supabase
      .from("developments")
      .delete()
      .eq("story_id", id);

    if (deleteError) {
      throw new Error(
        `Failed to delete old developments: ${deleteError.message}`
      );
    }

    // Insert new developments
    const developments = timeline.developments.map((dev, index) => ({
      story_id: id,
      date: dev.date,
      date_sort: dev.date_sort,
      source_label: dev.source_label,
      source_color: dev.source_color,
      headline: dev.headline,
      summary: dev.summary,
      sources: dev.sources,
      is_turning_point: dev.is_turning_point,
      position: index,
    }));

    const { error: devError } = await supabase
      .from("developments")
      .insert(developments);

    if (devError) {
      throw new Error(`Failed to insert developments: ${devError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Regeneration error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Regeneration failed",
      },
      { status: 500 }
    );
  }
}
