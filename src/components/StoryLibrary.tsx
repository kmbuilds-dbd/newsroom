"use client";

import { useMemo, useState } from "react";
import { Story, StoryCategory, STORY_CATEGORIES } from "@/lib/types";
import { PendingStory } from "./HomeContent";
import StoryList from "./StoryList";

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  geopolitics: "Geopolitics",
  tech: "Tech",
  health: "Health",
  economy: "Economy",
  science: "Science",
  culture: "Culture",
};

interface StoryLibraryProps {
  stories: Story[];
  pendingStories?: PendingStory[];
  onDismissPending?: (id: string) => void;
  onDelete?: (id: string) => void;
  externalCategory?: StoryCategory | null;
}

export default function StoryLibrary({
  stories,
  pendingStories,
  onDismissPending,
  onDelete,
  externalCategory,
}: StoryLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<StoryCategory | null>(
    null
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Derive which categories actually have stories
  const populatedCategories = useMemo(() => {
    const cats = new Set<StoryCategory>();
    for (const story of stories) {
      if (story.category && STORY_CATEGORIES.includes(story.category)) {
        cats.add(story.category);
      }
    }
    return STORY_CATEGORIES.filter((c) => cats.has(c));
  }, [stories]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = stories;

    const effectiveCategory = externalCategory !== undefined ? externalCategory : activeCategory;
    if (effectiveCategory) {
      result = result.filter((s) => s.category === effectiveCategory);
    }

    if (activeTag) {
      result = result.filter((s) => s.tags?.includes(activeTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          s.event_query.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [stories, activeCategory, activeTag, search, externalCategory]);

  return (
    <div className="mt-16 max-w-3xl mx-auto">
      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stories..."
          className="w-full bg-bg-card border border-timeline-line rounded-lg px-4 py-2.5 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-text-secondary transition-colors font-mono"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs font-mono"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category tabs */}
      {externalCategory === undefined && populatedCategories.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              activeCategory === null
                ? "bg-text-primary text-bg-primary"
                : "bg-bg-card text-text-secondary border border-timeline-line hover:text-text-primary"
            }`}
          >
            All
          </button>
          {populatedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                activeCategory === cat
                  ? "bg-text-primary text-bg-primary"
                  : "bg-bg-card text-text-secondary border border-timeline-line hover:text-text-primary"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Active tag indicator */}
      {activeTag && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-text-secondary">
            Filtered by tag:
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-bg-card border border-timeline-line text-text-primary hover:border-text-secondary transition-colors"
          >
            {activeTag}
            <span className="text-text-secondary ml-0.5">&times;</span>
          </button>
        </div>
      )}

      {/* Story count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary">
          {filtered.length === stories.length
            ? `${stories.length} Stories`
            : `${filtered.length} of ${stories.length} Stories`}
        </h2>
      </div>

      <StoryList
        stories={filtered}
        pendingStories={pendingStories}
        onDismissPending={onDismissPending}
        onTagClick={(tag) => setActiveTag(activeTag === tag ? null : tag)}
        onDelete={onDelete}
      />
    </div>
  );
}
