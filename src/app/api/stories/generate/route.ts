import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTimeline } from "@/lib/anthropic";
import { GenerateRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    if (!body.event_query || body.event_query.trim().length === 0) {
      return NextResponse.json(
        { error: "event_query is required" },
        { status: 400 }
      );
    }

    const timeline = await generateTimeline(body.event_query);

    // Insert story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        title: timeline.title,
        subtitle: timeline.subtitle,
        event_query: body.event_query,
        status: timeline.status,
      })
      .select()
      .single();

    if (storyError || !story) {
      throw new Error(`Failed to insert story: ${storyError?.message}`);
    }

    // Insert developments
    const developments = timeline.developments.map((dev, index) => ({
      story_id: story.id,
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

    return NextResponse.json({ story_id: story.id });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
