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
