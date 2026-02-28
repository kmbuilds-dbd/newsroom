# Newsroom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered news timeline generator — user enters an event name, Claude researches it, app renders an interactive visual timeline.

**Architecture:** Monolithic Next.js 14+ App Router app with Supabase for persistence and the Anthropic SDK for AI generation. API routes handle generation and retrieval; React components render the editorial-style timeline.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (Postgres), @anthropic-ai/sdk, html2canvas

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `.env.local`, `.gitignore`

**Step 1: Initialize Next.js project**

Run from the `newsroom/` directory:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Pick defaults for all prompts. This scaffolds the full Next.js project in the current directory.

**Step 2: Install dependencies**

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js html2canvas
```

**Step 3: Create `.env.local`**

```env
ANTHROPIC_API_KEY=your-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Update `.gitignore` to include `.env.local`**

Verify `.env.local` is already listed (create-next-app includes it). If not, add it.

**Step 5: Set up dark theme base in `src/app/globals.css`**

Replace the default content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600&display=swap');

:root {
  --bg-primary: #0f0f1a;
  --bg-card: #1a1a2e;
  --bg-card-hover: #22223a;
  --text-primary: #e8e6e3;
  --text-secondary: #9a9a9a;
  --timeline-line: #2a2a3e;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}
```

**Step 6: Update `tailwind.config.ts`**

Extend the theme with custom colors and fonts:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f1a',
          card: '#1a1a2e',
          'card-hover': '#22223a',
        },
        text: {
          primary: '#e8e6e3',
          secondary: '#9a9a9a',
        },
        timeline: {
          line: '#2a2a3e',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 7: Verify it runs**

```bash
npm run dev
```

Expected: App starts on http://localhost:3000 with dark background.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind dark theme"
```

---

### Task 2: TypeScript Types & Supabase Setup

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase.ts`
- Create: `supabase/migrations/001_create_tables.sql`

**Step 1: Define shared types in `src/lib/types.ts`**

```ts
export interface Source {
  title: string;
  url: string;
}

export interface Development {
  id: string;
  story_id: string;
  date: string;
  date_sort: string;
  source_label: string;
  source_color: string;
  headline: string;
  summary: string;
  sources: Source[];
  is_turning_point: boolean;
  position: number;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  event_query: string;
  status: "developing" | "concluded";
  created_at: string;
  updated_at: string;
  developments?: Development[];
}

export interface GenerateRequest {
  event_query: string;
}

export interface GenerateResponse {
  story_id: string;
}
```

**Step 2: Create Supabase client in `src/lib/supabase.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Step 3: Write SQL migration in `supabase/migrations/001_create_tables.sql`**

```sql
create extension if not exists "uuid-ossp";

create table stories (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text not null,
  event_query text not null,
  status text not null default 'developing' check (status in ('developing', 'concluded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table developments (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references stories(id) on delete cascade,
  date text not null,
  date_sort timestamptz not null,
  source_label text not null,
  source_color text not null,
  headline text not null,
  summary text not null,
  sources jsonb not null default '[]',
  is_turning_point boolean not null default false,
  position int not null default 0
);

create index idx_developments_story_id on developments(story_id);
create index idx_stories_created_at on stories(created_at desc);
```

**Step 4: Run migration in Supabase**

Go to Supabase dashboard → SQL Editor → paste and run `001_create_tables.sql`.

Alternatively, if using Supabase CLI:
```bash
npx supabase db push
```

**Step 5: Verify by checking Supabase dashboard**

Expected: `stories` and `developments` tables exist with correct columns.

**Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/supabase.ts supabase/
git commit -m "feat: add TypeScript types and Supabase schema"
```

---

### Task 3: Claude AI Generation Pipeline

**Files:**
- Create: `src/lib/anthropic.ts`

**Step 1: Create the Claude wrapper in `src/lib/anthropic.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { Story, Development } from "./types";

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
```

**Step 2: Verify the module compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 3: Commit**

```bash
git add src/lib/anthropic.ts
git commit -m "feat: add Claude AI timeline generation pipeline"
```

---

### Task 4: API Routes

**Files:**
- Create: `src/app/api/stories/generate/route.ts`
- Create: `src/app/api/stories/[id]/route.ts`

**Step 1: Create generation endpoint `src/app/api/stories/generate/route.ts`**

```ts
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
```

**Step 2: Create story retrieval endpoint `src/app/api/stories/[id]/route.ts`**

```ts
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
```

**Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for story generation and retrieval"
```

---

### Task 5: Timeline UI Components

**Files:**
- Create: `src/components/StoryHeader.tsx`
- Create: `src/components/TimelineCard.tsx`
- Create: `src/components/Timeline.tsx`

**Step 1: Create `src/components/StoryHeader.tsx`**

```tsx
import { Story } from "@/lib/types";

interface StoryHeaderProps {
  story: Story;
}

export default function StoryHeader({ story }: StoryHeaderProps) {
  return (
    <header className="text-center mb-16 pt-12">
      <div className="flex items-center justify-center gap-2 mb-4">
        {story.status === "developing" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Developing
          </span>
        )}
        {story.status === "concluded" && (
          <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">
            Concluded
          </span>
        )}
      </div>

      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold italic mb-4">
        {story.title}
      </h1>

      <p className="text-text-secondary text-lg max-w-2xl mx-auto">
        {story.subtitle}
      </p>
    </header>
  );
}
```

**Step 2: Create `src/components/TimelineCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Development } from "@/lib/types";

interface TimelineCardProps {
  development: Development;
  side: "left" | "right";
}

export default function TimelineCard({ development, side }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`flex items-start gap-8 mb-12 ${
        side === "left" ? "flex-row" : "flex-row-reverse"
      }`}
    >
      {/* Card */}
      <div
        className={`w-[calc(50%-2rem)] cursor-pointer group ${
          side === "left" ? "text-right" : "text-left"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={`bg-bg-card border border-timeline-line rounded-lg p-5 transition-colors hover:bg-bg-card-hover ${
            development.is_turning_point
              ? "ring-1 ring-opacity-50"
              : ""
          }`}
          style={
            development.is_turning_point
              ? { ringColor: development.source_color }
              : undefined
          }
        >
          <p className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-2">
            {development.date}
          </p>

          <span
            className="inline-block text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2"
            style={{
              color: development.source_color,
              backgroundColor: `${development.source_color}20`,
            }}
          >
            {development.source_label}
          </span>

          <h3 className="font-semibold text-text-primary text-base leading-snug mb-2">
            {development.headline}
          </h3>

          <p className="text-text-secondary text-sm leading-relaxed">
            {development.summary}
          </p>

          {/* Expanded: source links */}
          {expanded && development.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-timeline-line">
              <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-2">
                Sources
              </p>
              {development.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-400 hover:text-blue-300 underline mb-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            development.is_turning_point ? "w-4 h-4" : ""
          }`}
          style={{
            borderColor: development.source_color,
            backgroundColor: development.is_turning_point
              ? development.source_color
              : "transparent",
            boxShadow: development.is_turning_point
              ? `0 0 12px ${development.source_color}60`
              : "none",
          }}
        />
      </div>

      {/* Spacer for opposite side */}
      <div className="w-[calc(50%-2rem)]" />
    </div>
  );
}
```

**Step 3: Create `src/components/Timeline.tsx`**

```tsx
import { Development } from "@/lib/types";
import TimelineCard from "./TimelineCard";

interface TimelineProps {
  developments: Development[];
}

export default function Timeline({ developments }: TimelineProps) {
  return (
    <div className="relative max-w-5xl mx-auto px-4">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-timeline-line -translate-x-1/2" />

      {developments.map((dev, index) => (
        <TimelineCard
          key={dev.id}
          development={dev}
          side={index % 2 === 0 ? "left" : "right"}
        />
      ))}
    </div>
  );
}
```

**Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

**Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add Timeline, TimelineCard, and StoryHeader components"
```

---

### Task 6: Search Bar Component

**Files:**
- Create: `src/components/SearchBar.tsx`

**Step 1: Create `src/components/SearchBar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const { story_id } = await res.json();
      router.push(`/story/${story_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a news event..."
          disabled={loading}
          className="w-full bg-bg-card border border-timeline-line rounded-lg px-6 py-4 text-lg text-text-primary placeholder-text-secondary font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {loading && (
        <p className="text-center text-text-secondary text-sm mt-4 font-mono">
          Researching event and building timeline...
        </p>
      )}

      {error && (
        <p className="text-center text-red-400 text-sm mt-4">{error}</p>
      )}
    </form>
  );
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat: add SearchBar component with loading and error states"
```

---

### Task 7: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/StoryList.tsx`

**Step 1: Create `src/components/StoryList.tsx`**

```tsx
import Link from "next/link";
import { Story } from "@/lib/types";

interface StoryListProps {
  stories: Story[];
}

export default function StoryList({ stories }: StoryListProps) {
  if (stories.length === 0) return null;

  return (
    <div className="mt-16 max-w-3xl mx-auto">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary mb-6">
        Previous Stories
      </h2>
      <div className="space-y-3">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.id}`}
            className="block bg-bg-card border border-timeline-line rounded-lg p-5 hover:bg-bg-card-hover transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold italic text-text-primary group-hover:text-white transition-colors">
                  {story.title}
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  {story.subtitle}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {story.status === "developing" && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Live
                  </span>
                )}
                <span className="text-xs font-mono text-text-secondary">
                  {new Date(story.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Replace `src/app/page.tsx`**

```tsx
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import StoryList from "@/components/StoryList";

export const revalidate = 0;

export default async function Home() {
  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl md:text-6xl font-bold italic mb-4">
          Newsroom
        </h1>
        <p className="text-text-secondary text-lg">
          Understand any news event in depth. Enter an event to build its
          timeline.
        </p>
      </div>

      <SearchBar />
      <StoryList stories={(stories as Story[]) || []} />
    </main>
  );
}
```

**Step 3: Verify it runs**

```bash
npm run dev
```

Expected: Home page renders with search bar and (empty) story list at http://localhost:3000.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/StoryList.tsx
git commit -m "feat: add home page with search bar and story list"
```

---

### Task 8: Story Timeline Page

**Files:**
- Create: `src/app/story/[id]/page.tsx`

**Step 1: Create `src/app/story/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import StoryHeader from "@/components/StoryHeader";
import Timeline from "@/components/Timeline";
import ExportButton from "@/components/ExportButton";

export const revalidate = 0;

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (storyError || !story) {
    notFound();
  }

  const { data: developments } = await supabase
    .from("developments")
    .select("*")
    .eq("story_id", id)
    .order("position", { ascending: true });

  const fullStory: Story = {
    ...story,
    developments: developments || [],
  };

  return (
    <main className="min-h-screen pb-24">
      <StoryHeader story={fullStory} />
      <ExportButton />
      <div id="timeline-export-area">
        <Timeline developments={fullStory.developments || []} />
      </div>
    </main>
  );
}
```

**Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Note: This will fail because `ExportButton` doesn't exist yet. That's expected — we build it in the next task.

**Step 3: Commit**

```bash
git add src/app/story/
git commit -m "feat: add story timeline page"
```

---

### Task 9: PNG Export

**Files:**
- Create: `src/components/ExportButton.tsx`

**Step 1: Create `src/components/ExportButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import html2canvas from "html2canvas";

export default function ExportButton() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const element = document.getElementById("timeline-export-area");
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: "#0f0f1a",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = "timeline.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex justify-center mb-8">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="font-mono text-xs uppercase tracking-wider text-text-secondary border border-timeline-line rounded px-4 py-2 hover:bg-bg-card hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export PNG"}
      </button>
    </div>
  );
}
```

**Step 2: Verify the full app compiles and runs**

```bash
npx tsc --noEmit && npm run dev
```

Expected: No type errors. App runs. Story page renders with export button.

**Step 3: Commit**

```bash
git add src/components/ExportButton.tsx
git commit -m "feat: add PNG export via html2canvas"
```

---

### Task 10: End-to-End Verification & Polish

**Step 1: Add env variables**

Fill in real values in `.env.local`:
- Anthropic API key from https://console.anthropic.com
- Supabase URL and anon key from Supabase project settings

**Step 2: Run the full flow**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Enter an event (e.g. "The AI Standoff")
3. Wait for generation (10-30 seconds)
4. Verify timeline renders with cards, dots, and center line
5. Click a card to expand sources
6. Click "Export PNG" and verify download
7. Go back to home — verify story appears in list

**Step 3: Fix any issues found**

Address layout/styling/data issues discovered during testing.

**Step 4: Run linter**

```bash
npm run lint
```

Fix any lint errors.

**Step 5: Run impeccable design review**

Use the impeccable plugin (critique + polish) to review UI quality.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: polish and verify end-to-end flow"
```

---

## Task Dependency Summary

```
Task 1 (Scaffold) → Task 2 (Types + DB) → Task 3 (AI Pipeline) → Task 4 (API Routes)
                                                                         ↓
Task 5 (Timeline UI) → Task 6 (SearchBar) → Task 7 (Home Page) → Task 8 (Story Page) → Task 9 (Export) → Task 10 (E2E Verify)
```

Tasks 5-6 can be done in parallel. Everything else is sequential.
