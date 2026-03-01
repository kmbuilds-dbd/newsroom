import Link from "next/link";
import { Story, StoryCategory } from "@/lib/types";
import { PendingStory } from "./HomeContent";

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  geopolitics: "Geopolitics",
  tech: "Tech",
  health: "Health",
  economy: "Economy",
  science: "Science",
  culture: "Culture",
};

interface StoryListProps {
  stories: Story[];
  pendingStories?: PendingStory[];
  onDismissPending?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
}

function PendingCard({
  pending,
  onDismiss,
}: {
  pending: PendingStory;
  onDismiss?: (id: string) => void;
}) {
  const isError = pending.status === "error";

  return (
    <div
      className={`block bg-bg-card border rounded-lg p-5 ${
        isError
          ? "border-red-500/50"
          : "border-timeline-line animate-pulse"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-bold italic text-text-primary">
            {pending.event_query}
          </h3>
          <p
            className={`text-sm mt-1 ${
              isError ? "text-red-400" : "text-text-secondary"
            }`}
          >
            {isError
              ? pending.error || "Generation failed"
              : "Generating timeline..."}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {isError ? (
            <button
              onClick={() => onDismiss?.(pending.id)}
              className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
            >
              Dismiss
            </button>
          ) : (
            <div className="w-4 h-4 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function StoryList({
  stories,
  pendingStories,
  onDismissPending,
  onTagClick,
  onDelete,
}: StoryListProps) {
  const hasPending = pendingStories && pendingStories.length > 0;

  if (stories.length === 0 && !hasPending) return null;

  return (
    <div className="space-y-3">
      {pendingStories?.map((pending) => (
        <PendingCard
          key={pending.id}
          pending={pending}
          onDismiss={onDismissPending}
        />
      ))}
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/story/${story.id}`}
          className="block bg-bg-card border border-timeline-line rounded-lg p-5 hover:bg-bg-card-hover transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-bold italic text-text-primary group-hover:text-white transition-colors">
                {story.title}
              </h3>
              <p className="text-text-secondary text-sm mt-1">
                {story.subtitle}
              </p>
              {/* Tag chips */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {story.tags.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onTagClick?.(tag);
                      }}
                      className="px-2 py-0.5 rounded-full text-xs font-mono bg-bg-primary border border-timeline-line text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
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
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(story.id);
                    }}
                    className="text-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete story"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Category badge */}
              {story.category && (
                <span className="text-xs font-mono text-text-secondary bg-bg-primary border border-timeline-line rounded px-1.5 py-0.5">
                  {CATEGORY_LABELS[story.category]}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
