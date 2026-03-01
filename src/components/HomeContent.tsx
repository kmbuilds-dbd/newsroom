"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Story } from "@/lib/types";
import SearchBar from "./SearchBar";
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
  const router = useRouter();

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

  return (
    <>
      <SearchBar onSubmit={handleSubmit} />
      <StoryLibrary
        stories={stories}
        pendingStories={pendingStories}
        onDismissPending={dismissPending}
        onDelete={handleDelete}
      />
    </>
  );
}
