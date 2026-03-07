import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/api-auth";
import { NewsSection, NEWS_SECTIONS } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  const { headlines } = await request.json();

  if (!Array.isArray(headlines) || headlines.length === 0) {
    return NextResponse.json({ error: "headlines array required" }, { status: 400 });
  }

  const numberedList = headlines
    .map((h: string, i: number) => `${i}: ${h}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Classify each headline into exactly one section.\n\nSections: ${NEWS_SECTIONS.join(", ")}\n\nHeadlines:\n${numberedList}\n\nReturn ONLY a JSON array of objects: [{"index": 0, "section": "Politics"}, ...]\nNo markdown, no code fences, no preamble.`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
  }

  let jsonStr = textBlock.text.trim();
  const match = jsonStr.match(/\[[\s\S]*\]/);
  if (match) jsonStr = match[0];

  try {
    const classifications: { index: number; section: string }[] = JSON.parse(jsonStr);

    const validated = classifications.map((c) => ({
      index: c.index,
      section: NEWS_SECTIONS.includes(c.section as NewsSection) ? c.section : "Other",
    }));

    return NextResponse.json({ classifications: validated });
  } catch {
    return NextResponse.json({ error: "Failed to parse classification response" }, { status: 500 });
  }
}
