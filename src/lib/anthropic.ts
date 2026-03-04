import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GeneratedTimeline {
  title: string;
  subtitle: string;
  status: "developing" | "concluded";
  category: string | null;
  tags: string[];
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

IMPORTANT: You have access to web search. USE IT to find the latest developments and verify dates. Search for the event to ensure your timeline is complete and up-to-date.

Return ONLY valid JSON (no markdown, no code fences, no preamble) matching this exact schema:

{
  "title": "Short editorial title for the event",
  "subtitle": "Short subtitle explaining the arc (max 80 characters)",
  "status": "developing" or "concluded",
  "category": one of "geopolitics", "tech", "health", "economy", "science", "culture",
  "tags": ["lowercase-tag-1", "lowercase-tag-2", ...],
  "developments": [
    {
      "date": "Display date (e.g. 'JAN 9, 2026' or 'FEB 27 · 3:30P')",
      "date_sort": "ISO 8601 timestamp for sorting (e.g. '2026-01-09T00:00:00Z')",
      "source_label": "Primary actor/source in UPPERCASE (e.g. 'PENTAGON', 'ANTHROPIC')",
      "source_color": "Hex color for this actor (consistent per actor across the timeline)",
      "headline": "Bold headline summarizing this development",
      "summary": "One complete factual sentence, no filler. Must fit in 120 characters.",
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
- The subtitle should capture the narrative arc in max 80 characters (e.g. "From partner to threat in seven months")
- Dates should be human-readable and uppercase
- Pick the single best-fit category for the event
- Include 3-8 lowercase tags covering topics, key actors, and themes (e.g. "regulation", "ai-safety", "european-union")
- Your response must be ONLY the JSON object. No text before or after.`;

export async function generateTimeline(
  eventQuery: string
): Promise<GeneratedTimeline> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `Search the web for the latest information, then create a detailed chronological timeline for this news event: "${eventQuery}"`,
      },
    ],
    system: SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 10,
      },
    ],
  });

  // With web search, there are multiple text blocks interleaved with tool results.
  // The JSON is in the last text block.
  const textBlocks = message.content.filter((block) => block.type === "text");
  if (textBlocks.length === 0) {
    throw new Error("No text response from Claude");
  }

  // Try each text block from last to first to find valid JSON
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const block = textBlocks[i];
    if (block.type !== "text") continue;

    // Strip <cite> tags injected by web search
    let jsonStr = block.text.replace(/<\/?cite[^>]*>/g, "").trim();

    // Try code block extraction
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Try to extract JSON object if there's surrounding text
      const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonStr = jsonObjectMatch[0];
      }
    }

    try {
      const parsed: GeneratedTimeline = JSON.parse(jsonStr);
      return parsed;
    } catch {
      // This text block didn't have valid JSON, try the next one
      continue;
    }
  }

  throw new Error("No valid JSON found in Claude response");
}
