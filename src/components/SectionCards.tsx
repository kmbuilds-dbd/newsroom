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
  const [prevSection, setPrevSection] = useState(section);

  // Reset page when section changes (adjust state during render, not in an effect)
  if (prevSection !== section) {
    setPrevSection(section);
    setPage(0);
  }

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
                className="w-8 h-8 flex items-center justify-center rounded border border-timeline-line text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors text-sm leading-none"
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
