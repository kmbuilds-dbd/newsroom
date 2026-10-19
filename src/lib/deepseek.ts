// DeepSeek chat-completions client (OpenAI-compatible API).
// Server-side only: DEEPSEEK_API_KEY is read from the server environment
// and never exposed to the client.
//
// NOTE: DeepSeek has no web-browsing tool, unlike the previous Claude
// setup. Timelines are generated from the model's training knowledge,
// so the prompt explicitly forbids inventing source URLs.

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

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

interface ChatOptions {
  system?: string;
  user: string;
  maxTokens?: number;
  /** When true, request a JSON object response. */
  jsonMode?: boolean;
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }
  return key;
}

async function chatCompletion({
  system,
  user,
  maxTokens = 4096,
  jsonMode = false,
}: ChatOptions): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `DeepSeek API error (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`
    );
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from DeepSeek");
  }
  return content;
}

/** Extract a JSON object from a model response (tolerates code fences). */
function extractJsonObject(text: string): string {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonStr = jsonObjectMatch[0];
    }
  }
  return jsonStr;
}

const SYSTEM_PROMPT = `You are a senior investigative journalist and researcher. Given a news event, produce a comprehensive chronological timeline.

You do NOT have web access. Draw on your training knowledge of the event. Only include source URLs you are confident are real — never invent or guess a URL. If you are unsure of a source URL, omit that source rather than fabricating one.

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
  // deepseek-chat caps output at 8192 tokens.
  const content = await chatCompletion({
    system: SYSTEM_PROMPT,
    user: `Create a detailed chronological timeline for this news event: "${eventQuery}"`,
    maxTokens: 8192,
    jsonMode: true,
  });

  try {
    const parsed: GeneratedTimeline = JSON.parse(extractJsonObject(content));
    return parsed;
  } catch {
    throw new Error("No valid JSON found in DeepSeek response");
  }
}

/** Plain-text chat completion, used by the ask-a-question route. */
export async function askQuestion(
  system: string,
  question: string
): Promise<string> {
  return chatCompletion({
    system,
    user: question,
    maxTokens: 1024,
  });
}

/** Classify headlines into sections. Returns raw validated-by-caller rows. */
export async function classifyHeadlines(
  headlines: string[]
): Promise<{ index: number; section: string }[]> {
  const numberedList = headlines
    .map((h: string, i: number) => `${i}: ${h}`)
    .join("\n");

  const content = await chatCompletion({
    user: `Classify each headline into exactly one section.\n\nSections: Sports, Politics, Global, US, India, Technology, Business, Other\n\nHeadlines:\n${numberedList}\n\nReturn ONLY a JSON object of this shape: {"classifications": [{"index": 0, "section": "Politics"}, ...]}\nNo markdown, no code fences, no preamble.`,
    maxTokens: 4096,
    jsonMode: true,
  });

  const parsed = JSON.parse(extractJsonObject(content)) as {
    classifications?: { index: number; section: string }[];
  };
  // Tolerate a bare array if the model ignores the wrapper.
  if (Array.isArray(parsed)) {
    return parsed as { index: number; section: string }[];
  }
  if (Array.isArray(parsed.classifications)) {
    return parsed.classifications;
  }
  throw new Error("Failed to parse classification response");
}
