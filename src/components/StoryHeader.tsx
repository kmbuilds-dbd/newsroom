import Link from "next/link";
import { Story } from "@/lib/types";

interface StoryHeaderProps {
  story: Story;
}

function formatDateRange(story: Story): string | null {
  const devs = story.developments;
  if (!devs || devs.length === 0) return null;

  const sorted = [...devs].sort((a, b) =>
    a.date_sort.localeCompare(b.date_sort)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d
      .toLocaleDateString("en-US", { month: "short", year: "numeric" })
      .toUpperCase();
  };

  const firstFormatted = formatDate(first.date_sort);
  const lastFormatted = formatDate(last.date_sort);

  if (firstFormatted === lastFormatted) return firstFormatted;
  return `${firstFormatted} — ${lastFormatted}`;
}

export default function StoryHeader({ story }: StoryHeaderProps) {
  const dateRange = formatDateRange(story);

  return (
    <header className="text-center mb-6 lg:mb-10 pt-8 lg:pt-12 px-4">
      <div className="mb-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors"
        >
          &larr; All Stories
        </Link>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
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
        {dateRange && (
          <>
            <span className="text-text-secondary/40 text-xs">&middot;</span>
            <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">
              {dateRange}
            </span>
          </>
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
