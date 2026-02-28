"use client";

import { useState } from "react";
import { Development } from "@/lib/types";

interface TimelineCardProps {
  development: Development;
  side: "left" | "right";
}

export default function TimelineCard({ development, side }: TimelineCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`flex items-start gap-8 mb-12 ${
        side === "left" ? "flex-row" : "flex-row-reverse"
      }`}
    >
      {/* Card */}
      <div
        className={`w-[calc(50%-2rem)] cursor-pointer group ${
          side === "left" ? "text-right" : "text-left"
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={`bg-bg-card border border-timeline-line rounded-lg p-5 transition-colors hover:bg-bg-card-hover ${
            development.is_turning_point
              ? "ring-1 ring-opacity-50"
              : ""
          }`}
          style={
            development.is_turning_point
              ? { "--tw-ring-color": development.source_color } as React.CSSProperties
              : undefined
          }
        >
          <p className="font-mono text-xs text-text-secondary uppercase tracking-wider mb-2">
            {development.date}
          </p>

          <span
            className="inline-block text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2"
            style={{
              color: development.source_color,
              backgroundColor: `${development.source_color}20`,
            }}
          >
            {development.source_label}
          </span>

          <h3 className="font-semibold text-text-primary text-base leading-snug mb-2">
            {development.headline}
          </h3>

          <p className="text-text-secondary text-sm leading-relaxed">
            {development.summary}
          </p>

          {/* Expanded: source links */}
          {expanded && development.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-timeline-line">
              <p className="text-xs text-text-secondary font-mono uppercase tracking-wider mb-2">
                Sources
              </p>
              {development.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-400 hover:text-blue-300 underline mb-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            development.is_turning_point ? "w-4 h-4" : ""
          }`}
          style={{
            borderColor: development.source_color,
            backgroundColor: development.is_turning_point
              ? development.source_color
              : "transparent",
            boxShadow: development.is_turning_point
              ? `0 0 12px ${development.source_color}60`
              : "none",
          }}
        />
      </div>

      {/* Spacer for opposite side */}
      <div className="w-[calc(50%-2rem)]" />
    </div>
  );
}
