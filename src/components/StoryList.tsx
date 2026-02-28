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
