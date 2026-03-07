# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Newsroom landing page into a section-based dashboard with left sidebar navigation, AI-classified headline cards, and saved story browsing.

**Architecture:** Left sidebar (220px fixed) with news section nav + saved story categories. Main area shows horizontal row of 5 square headline cards per section with prev/next pagination, and saved stories below. AI classification endpoint batches headlines to Claude for section assignment.

**Tech Stack:** Next.js 16 / TypeScript / Tailwind CSS 3 / Anthropic SDK / Supabase

---

### Task 1: Add NewsSection type

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add the type and constant**

Add to the end of `src/lib/types.ts` (after `GenerateResponse`):

```typescript
export type NewsSection =
  | "Sports"
  | "Politics"
  | "Global"
  | "US"
  | "India"
  | "Technology"
  | "Business"
  | "Other";

export const NEWS_SECTIONS: NewsSection[] = [
  "Sports",
  "Politics",
  "Global",
  "US",
  "India",
  "Technology",
  "Business",
  "Other",
];

export interface ClassifiedNewsItem extends NewsItem {
  section: NewsSection;
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add NewsSection type and ClassifiedNewsItem interface"
```

---

### Task 2: Create AI classification endpoint

**Files:**
- Create: `src/app/api/news/classify/route.ts`

**Step 1: Create the endpoint**

```typescript
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

    // Validate sections, default invalid ones to "Other"
    const validated = classifications.map((c) => ({
      index: c.index,
      section: NEWS_SECTIONS.includes(c.section as NewsSection) ? c.section : "Other",
    }));

    return NextResponse.json({ classifications: validated });
  } catch {
    return NextResponse.json({ error: "Failed to parse classification response" }, { status: 500 });
  }
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/news/classify/route.ts
git commit -m "feat: add AI headline classification endpoint"
```

---

### Task 3: Create Sidebar component

**Files:**
- Create: `src/components/Sidebar.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { NewsSection, NEWS_SECTIONS, StoryCategory, STORY_CATEGORIES } from "@/lib/types";

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  geopolitics: "Geopolitics",
  tech: "Tech",
  health: "Health",
  economy: "Economy",
  science: "Science",
  culture: "Culture",
};

interface SidebarProps {
  activeSection: NewsSection;
  onSectionChange: (section: NewsSection) => void;
  sectionCounts: Record<NewsSection, number>;
  activeCategory: StoryCategory | null;
  onCategoryChange: (category: StoryCategory | null) => void;
  categoryCounts: Record<StoryCategory, number>;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  sectionCounts,
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: SidebarProps) {
  const populatedCategories = STORY_CATEGORIES.filter(
    (cat) => categoryCounts[cat] > 0
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-timeline-line h-[calc(100vh-80px)] sticky top-20 overflow-y-auto">
        {/* News Sections */}
        <div className="px-4 py-4">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-3">
            Sections
          </h3>
          <nav className="space-y-0.5">
            {NEWS_SECTIONS.map((section) => {
              const count = sectionCounts[section] || 0;
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  onClick={() => onSectionChange(section)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-sans transition-colors ${
                    isActive
                      ? "bg-bg-card text-text-primary border-l-2 border-text-primary"
                      : count > 0
                        ? "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                        : "text-text-secondary/40 cursor-default"
                  }`}
                  disabled={count === 0}
                >
                  <span>{section}</span>
                  <span
                    className={`font-mono text-xs ${
                      isActive ? "text-text-primary" : "text-text-secondary/60"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-timeline-line" />

        {/* My Stories */}
        <div className="px-4 py-4">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-3">
            My Stories
          </h3>
          <nav className="space-y-0.5">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-sans transition-colors ${
                activeCategory === null
                  ? "bg-bg-card text-text-primary border-l-2 border-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
              }`}
            >
              <span>All</span>
            </button>
            {populatedCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(isActive ? null : cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-sans transition-colors ${
                    isActive
                      ? "bg-bg-card text-text-primary border-l-2 border-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span className="font-mono text-xs text-text-secondary/60">
                    {categoryCounts[cat]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile: horizontal scrollable bar */}
      <div className="md:hidden overflow-x-auto px-4 py-3 border-b border-timeline-line">
        <div className="flex gap-2">
          {NEWS_SECTIONS.map((section) => {
            const count = sectionCounts[section] || 0;
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                onClick={() => onSectionChange(section)}
                disabled={count === 0}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                  isActive
                    ? "bg-text-primary text-bg-primary"
                    : count > 0
                      ? "bg-bg-card text-text-secondary border border-timeline-line hover:text-text-primary"
                      : "bg-bg-card text-text-secondary/30 border border-timeline-line/30"
                }`}
              >
                {section} ({count})
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with section nav and story categories"
```

---

### Task 4: Create SectionCards component

**Files:**
- Create: `src/components/SectionCards.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { ClassifiedNewsItem, NewsSection } from "@/lib/types";

const SOURCE_COLORS: Record<string, string> = {
  BBC: "bg-red-600",
  NPR: "bg-blue-600",
  Guardian: "bg-sky-900",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

const PAGE_SIZE = 5;

interface SectionCardsProps {
  section: NewsSection;
  items: ClassifiedNewsItem[];
  onAddStory: (title: string) => void;
}

export default function SectionCards({
  section,
  items,
  onAddStory,
}: SectionCardsProps) {
  const [page, setPage] = useState(0);

  // Reset page when section changes
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems = items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const hasPrev = safePage > 0;
  const hasNext = safePage < totalPages - 1;

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary text-sm font-mono">
        No stories in {section}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary">
          {section}{" "}
          <span className="text-text-secondary/60">({items.length})</span>
        </h2>
        <span className="font-mono text-xs text-text-secondary">
          {safePage + 1} / {totalPages}
        </span>
      </div>

      {/* Cards row */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {pageItems.map((item, i) => (
          <a
            key={safePage * PAGE_SIZE + i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-[180px] h-[180px] bg-bg-card border border-timeline-line rounded-lg p-3.5 flex flex-col justify-between hover:bg-bg-card-hover hover:border-text-secondary/30 transition-colors group relative"
          >
            {/* Top row: source + time */}
            <div className="flex items-center justify-between">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase text-white ${
                  SOURCE_COLORS[item.source] ?? "bg-gray-600"
                }`}
              >
                {item.source}
              </span>
              {item.pubDate && (
                <span className="text-[10px] font-mono text-text-secondary">
                  {timeAgo(item.pubDate)}
                </span>
              )}
            </div>

            {/* Headline */}
            <p className="font-serif text-sm leading-snug text-text-primary group-hover:text-white transition-colors line-clamp-3 mt-2 flex-1">
              {item.title}
            </p>

            {/* Add button */}
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddStory(item.title);
                }}
                className="w-6 h-6 flex items-center justify-center rounded border border-timeline-line text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors text-xs leading-none"
                aria-label={`Add story for ${item.title}`}
                title="Add story"
              >
                +
              </button>
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className="text-xs font-mono text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            &larr; Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={!hasNext}
            className="text-xs font-mono text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/SectionCards.tsx
git commit -m "feat: add SectionCards component with square card grid and pagination"
```

---

### Task 5: Rewrite HomeContent to orchestrate the new layout

**Files:**
- Modify: `src/components/HomeContent.tsx`

**Step 1: Rewrite HomeContent**

Replace the entire contents of `src/components/HomeContent.tsx` with:

```tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Story,
  NewsItem,
  ClassifiedNewsItem,
  NewsSection,
  NEWS_SECTIONS,
  StoryCategory,
  STORY_CATEGORIES,
} from "@/lib/types";
import Sidebar from "./Sidebar";
import SectionCards from "./SectionCards";
import AddStoryModal from "./AddStoryModal";
import StoryLibrary from "./StoryLibrary";

export interface PendingStory {
  id: string;
  event_query: string;
  status: "generating" | "error";
  error?: string;
}

interface HomeContentProps {
  stories: Story[];
}

export default function HomeContent({ stories }: HomeContentProps) {
  const [pendingStories, setPendingStories] = useState<PendingStory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillQuery, setPrefillQuery] = useState("");
  const router = useRouter();

  // News state
  const [newsItems, setNewsItems] = useState<ClassifiedNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NewsSection>("Politics");
  const [activeCategory, setActiveCategory] = useState<StoryCategory | null>(null);

  // Fetch and classify news
  useEffect(() => {
    setNewsLoading(true);

    fetch("/api/news")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch news");
        return res.json();
      })
      .then((items: NewsItem[]) => {
        // Classify headlines
        const headlines = items.map((item) => item.title);
        return fetch("/api/news/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headlines }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Classification failed");
            return res.json();
          })
          .then(
            (data: {
              classifications: { index: number; section: string }[];
            }) => {
              const classified: ClassifiedNewsItem[] = items.map(
                (item, idx) => {
                  const match = data.classifications.find(
                    (c) => c.index === idx
                  );
                  return {
                    ...item,
                    section: (match?.section as NewsSection) || "Other",
                  };
                }
              );
              setNewsItems(classified);

              // Set default active section to first with items
              const firstWithItems = NEWS_SECTIONS.find((s) =>
                classified.some((item) => item.section === s)
              );
              if (firstWithItems) setActiveSection(firstWithItems);
            }
          );
      })
      .catch(() => {
        setNewsItems([]);
      })
      .finally(() => {
        setNewsLoading(false);
      });
  }, []);

  // Section counts
  const sectionCounts = useMemo(() => {
    const counts = {} as Record<NewsSection, number>;
    for (const s of NEWS_SECTIONS) counts[s] = 0;
    for (const item of newsItems) counts[item.section]++;
    return counts;
  }, [newsItems]);

  // Category counts for saved stories
  const categoryCounts = useMemo(() => {
    const counts = {} as Record<StoryCategory, number>;
    for (const c of STORY_CATEGORIES) counts[c] = 0;
    for (const story of stories) {
      if (story.category) counts[story.category]++;
    }
    return counts;
  }, [stories]);

  // Items for current section
  const sectionItems = useMemo(
    () => newsItems.filter((item) => item.section === activeSection),
    [newsItems, activeSection]
  );

  const handleSubmit = useCallback(
    (query: string) => {
      const pendingId = crypto.randomUUID();

      setPendingStories((prev) => [
        { id: pendingId, event_query: query, status: "generating" },
        ...prev,
      ]);

      fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_query: query }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Generation failed");
          }
          return res.json();
        })
        .then(() => {
          setPendingStories((prev) =>
            prev.filter((p) => p.id !== pendingId)
          );
          router.refresh();
        })
        .catch((err) => {
          setPendingStories((prev) =>
            prev.map((p) =>
              p.id === pendingId
                ? {
                    ...p,
                    status: "error" as const,
                    error:
                      err instanceof Error
                        ? err.message
                        : "Something went wrong",
                  }
                : p
            )
          );
        });
    },
    [router]
  );

  const dismissPending = useCallback((id: string) => {
    setPendingStories((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this story? This cannot be undone.")) return;

      try {
        const res = await fetch(`/api/stories/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Delete failed");
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete story");
      }
    },
    [router]
  );

  const openModal = useCallback((query = "") => {
    setPrefillQuery(query);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPrefillQuery("");
  }, []);

  return (
    <div className="flex gap-0 min-h-[calc(100vh-120px)]">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionCounts={sectionCounts}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      <div className="flex-1 min-w-0 px-6 py-4">
        {/* Section cards */}
        {newsLoading ? (
          <div className="flex gap-3 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[180px] h-[180px] bg-bg-card rounded-lg animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <SectionCards
              section={activeSection}
              items={sectionItems}
              onAddStory={handleSubmit}
            />
          </div>
        )}

        {/* Add story button */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 bg-bg-card border border-timeline-line rounded-lg text-sm font-mono text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
          >
            + Add a Story
          </button>
        </div>

        {/* Saved stories */}
        <StoryLibrary
          stories={stories}
          pendingStories={pendingStories}
          onDismissPending={dismissPending}
          onDelete={handleDelete}
          externalCategory={activeCategory}
        />
      </div>

      <AddStoryModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialQuery={prefillQuery}
      />
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: May show error about `externalCategory` prop on StoryLibrary — we fix that in Task 6.

---

### Task 6: Update StoryLibrary to accept external category filter

**Files:**
- Modify: `src/components/StoryLibrary.tsx`

**Step 1: Add externalCategory prop**

In `StoryLibrary.tsx`, update the interface and filtering logic:

1. Add to `StoryLibraryProps`:
```typescript
externalCategory?: StoryCategory | null;
```

2. Add the prop to the destructured params:
```typescript
export default function StoryLibrary({
  stories,
  pendingStories,
  onDismissPending,
  onDelete,
  externalCategory,
}: StoryLibraryProps) {
```

3. In the `filtered` useMemo, replace the `activeCategory` filter with a combined check that prioritizes `externalCategory` when set:

Replace this block:
```typescript
if (activeCategory) {
  result = result.filter((s) => s.category === activeCategory);
}
```

With:
```typescript
const effectiveCategory = externalCategory !== undefined ? externalCategory : activeCategory;
if (effectiveCategory) {
  result = result.filter((s) => s.category === effectiveCategory);
}
```

4. Add `externalCategory` to the useMemo dependency array.

5. Hide the internal category tabs when `externalCategory` is provided (since the sidebar handles this). Wrap the category tabs section:

```tsx
{externalCategory === undefined && populatedCategories.length > 0 && (
  // existing category tab buttons
)}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/HomeContent.tsx src/components/StoryLibrary.tsx
git commit -m "feat: wire up new dashboard layout with sidebar-driven category filtering"
```

---

### Task 7: Update page.tsx layout

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Update the page layout**

Replace the contents of the `<main>` element to use a top header bar + full-width content area:

```tsx
export default async function Home() {
  const session = await auth();

  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, title, subtitle, event_query, status, category, tags, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <main className="min-h-screen">
      {/* Top header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-timeline-line">
        <h1 className="font-serif text-2xl font-bold italic">Newsroom</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
          className="flex items-center gap-3"
        >
          <span className="text-text-secondary text-sm">
            {session?.user?.email}
          </span>
          <button
            type="submit"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      <HomeContent stories={(stories as Story[]) || []} />
    </main>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update page layout with top header bar for dashboard"
```

---

### Task 8: Add line-clamp utility to Tailwind config

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Check if line-clamp is needed**

Tailwind v3.3+ includes `line-clamp` natively. Verify by checking the tailwind version:

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && cat node_modules/tailwindcss/package.json | grep version`

If v3.3+, no config change needed (line-clamp-3 works out of the box). If older, add `@tailwindcss/line-clamp` plugin.

**Step 2: Commit (only if config changed)**

```bash
git add tailwind.config.ts
git commit -m "chore: ensure line-clamp support in tailwind"
```

---

### Task 9: Reset SectionCards page when section changes

**Files:**
- Modify: `src/components/SectionCards.tsx`

**Step 1: Add useEffect to reset page on section change**

Add after the `useState` for page:

```tsx
useEffect(() => {
  setPage(0);
}, [section]);
```

Import `useEffect` from react (add to the existing import).

**Step 2: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/SectionCards.tsx
git commit -m "fix: reset card pagination when section changes"
```

---

### Task 10: Clean up old TopStories component

**Files:**
- Delete: `src/components/TopStories.tsx` (no longer imported anywhere)

**Step 1: Verify TopStories is no longer imported**

Run: `grep -r "TopStories" /Users/kunalmorparia/Documents/Script/claude_all/newsroom/src/`

Expected: No matches (HomeContent no longer imports it after Task 5 rewrite)

**Step 2: Delete the file**

```bash
rm /Users/kunalmorparia/Documents/Script/claude_all/newsroom/src/components/TopStories.tsx
```

**Step 3: Verify build**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused TopStories component"
```

---

### Task 11: End-to-end smoke test

**Step 1: Start dev server**

Run: `cd /Users/kunalmorparia/Documents/Script/claude_all/newsroom && npm run dev`

**Step 2: Verify in browser**

Open `http://localhost:3000` and check:
1. Left sidebar shows 8 news sections
2. Clicking a section shows square cards in horizontal row
3. Previous/Next buttons work for sections with >5 stories
4. Clicking a card opens the article link
5. [+] button on card triggers story generation
6. "My Stories" section in sidebar filters saved stories
7. "+ Add a Story" button still works
8. Mobile view: sidebar collapses to horizontal pill bar
9. Sign out still works

**Step 3: Fix any issues found**

If TypeScript or runtime errors, fix and commit.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: landing page redesign complete — section dashboard with sidebar"
```
