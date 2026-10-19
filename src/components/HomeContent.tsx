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
    fetch("/api/news")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch news");
        return res.json();
      })
      .then((items: NewsItem[]) => {
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
    <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-120px)]">
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
