import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Development } from "@/lib/types";
import { requireAuth } from "@/lib/api-auth";
import { askQuestion } from "@/lib/deepseek";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  const { id } = await params;

  const { question } = await request.json();
  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    );
  }

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

  const timelineContext = (developments as Development[])
    .map(
      (d) =>
        `[${d.date}] ${d.source_label}: ${d.headline} — ${d.summary}`
    )
    .join("\n");

  const systemPrompt = `You are a knowledgeable news analyst. You have full context on the following news event:

Title: ${story.title}
Subtitle: ${story.subtitle}
Status: ${story.status}

Timeline of developments:
${timelineContext}

Answer the user's question about this topic accurately and concisely. Draw on the timeline context above, and supplement with your broader knowledge where helpful. Keep answers to 2-3 paragraphs unless the question requires more detail.`;

  try {
    const answer = await askQuestion(systemPrompt, question.trim());
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Ask API error:", err);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
