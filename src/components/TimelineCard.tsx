"use client";

import { useState } from "react";
import { Development } from "@/lib/types";

interface TimelineCardProps {
  development: Development;
  align?: "left" | "right";
}

export default function TimelineCard({ development, align = "left" }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    setExpanded((prev) => !prev);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={development.sources.length > 0 ? expanded : undefined}
      className="cursor-pointer outline-none group"
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div
        className={`bg-bg-card/60 border border-white/[0.06] rounded-sm p-4 transition-all duration-150 ease-out
          hover:bg-bg-card-hover active:scale-[0.985]
          group-focus-visible:ring-2 group-focus-visible:ring-white/20 group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-transparent
          ${development.is_turning_point ? "ring-1 ring-opacity-50" : ""}`}
        style={
          development.is_turning_point
            ? {
                "--tw-ring-color": development.source_color,
              } as React.CSSProperties
            : undefined
        }
      >
        {/* Date + expand indicator */}
        <div className={`flex items-center justify-between mb-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
          <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            {development.date}
          </p>
          {development.sources.length > 0 && (
            <svg
              className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ease-out ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* Source badge + turning point dot */}
        <div className={`flex items-center gap-2 mb-2 ${align === "right" ? "justify-end" : ""}`}>
          {development.is_turning_point && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: development.source_color,
                boxShadow: `0 0 6px ${development.source_color}80`,
              }}
            />
          )}
          <span
            className="inline-block text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              color: development.source_color,
              backgroundColor: `${development.source_color}20`,
            }}
          >
            {development.source_label}
          </span>
        </div>

        <h3 className={`font-semibold text-text-primary text-base leading-snug ${align === "right" ? "text-right" : ""}`}>
          {development.headline}
        </h3>

        {/* Summary — always visible */}
        <p className={`text-text-secondary text-xs leading-relaxed mt-1 ${align === "right" ? "text-right" : ""}`}>
          {development.summary}
        </p>

        {/* Expanded: sources only */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            expanded && development.sources.length > 0
              ? "grid-rows-[1fr]"
              : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            {development.sources.length > 0 && (
              <div className={`mt-3 pt-3 border-t border-white/[0.06] ${align === "right" ? "text-right" : ""}`}>
                <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-2">
                  Sources
                </p>
                {development.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-400 hover:text-blue-300 no-underline hover:underline mb-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
