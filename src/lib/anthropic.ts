import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GeneratedTimeline {
  title: string;
  subtitle: string;
  status: "developing" | "concluded";
  developments: {
    date: string;
    date_sort: string;
    source_label: string;
    source_color: string;
    headline: string;
    summary: string;
    sources: { title: string; url: string }[];
    is_turning_point: boolean;
  }[];
}

const SYSTEM_PROMPT = `You are a senior investigative journalist and researcher. Given a news event, produce a comprehensive chronological timeline.

Return ONLY valid JSON matching this exact schema:

{
  "title": "Short editorial title for the event",
  "subtitle": "One-sentence subtitle explaining the arc",
  "status": "developing" or "concluded",
  "developments": [
    {
      "date": "Display date (e.g. 'JAN 9, 2026' or 'FEB 27 · 3:30P')",
      "date_sort": "ISO 8601 timestamp for sorting (e.g. '2026-01-09T00:00:00Z')",
      "source_label": "Primary actor/source in UPPERCASE (e.g. 'PENTAGON', 'ANTHROPIC')",
      "source_color": "Hex color for this actor (consistent per actor across the timeline)",
      "headline": "Bold headline summarizing this development",
      "summary": "1-3 sentences covering what happened, public reaction, and implications",
      "sources": [{"title": "Source name", "url": "https://..."}],
      "is_turning_point": true/false
    }
  ]
}

Guidelines:
- Include 10-20 key developments in chronological order
- Assign consistent colors per actor: use warm tones for government (reds, oranges), cool tones for companies (blues, teals), neutral for media (grays)
- Mark 2-4 developments as turning points — the moments that changed the trajectory
- Each development should have 1-2 real, verifiable source URLs
- The subtitle should capture the narrative arc (e.g. "From partner to threat in seven months")
- Dates should be human-readable and uppercase`;

export async function generateTimeline(
  eventQuery: string
): Promise<GeneratedTimeline> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Research and create a detailed chronological timeline for this news event: "${eventQuery}"`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed: GeneratedTimeline = JSON.parse(jsonStr);
  return parsed;
}
