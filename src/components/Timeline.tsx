import React from "react";
import { Development } from "@/lib/types";
import TimelineCard from "./TimelineCard";

interface TimelineProps {
  developments: Development[];
}

function ColumnConnector({ color }: { color: string }) {
  return (
    <div className="flex justify-center">
      <div
        className="w-[2px] h-4 rounded-full"
        style={{ backgroundColor: `${color}50` }}
      />
    </div>
  );
}

export default function Timeline({ developments }: TimelineProps) {
  const firstColor = developments[0]?.source_color;
  const lastColor = developments[developments.length - 1]?.source_color;

  const lineGradient: React.CSSProperties =
    firstColor && lastColor
      ? { background: `linear-gradient(to bottom, ${firstColor}50, ${lastColor}50)` }
      : {};

  // Split into two columns: first half left, second half right
  const mid = Math.ceil(developments.length / 2);
  const leftColumn = developments.slice(0, mid);
  const rightColumn = developments.slice(mid);

  return (
    <div className="max-w-5xl mx-auto px-3 lg:px-4">
      {/* Desktop: two independent columns with center timeline (lg+ only) */}
      <div className="hidden lg:grid grid-cols-[1fr_1.5rem_1fr] relative">
        {/* Continuous gradient line */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] rounded-full ${
            lineGradient.background ? "" : "bg-timeline-line"
          }`}
          style={lineGradient}
        />

        {/* Left column — first half, top to bottom */}
        <div className="flex flex-col">
          {leftColumn.map((dev, i) => (
            <React.Fragment key={dev.id}>
              <TimelineCard development={dev} align="right" />
              {i < leftColumn.length - 1 && (
                <ColumnConnector color={dev.source_color} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Center spacer */}
        <div />

        {/* Right column — second half, top to bottom */}
        <div className="flex flex-col">
          {rightColumn.map((dev, i) => (
            <React.Fragment key={dev.id}>
              <TimelineCard development={dev} />
              {i < rightColumn.length - 1 && (
                <ColumnConnector color={dev.source_color} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile + tablet: single column with left timeline */}
      <div className="lg:hidden relative">
        {/* Vertical line */}
        <div
          className={`absolute left-[7px] top-0 bottom-0 w-[2px] rounded-full ${
            lineGradient.background ? "" : "bg-timeline-line"
          }`}
          style={lineGradient}
        />

        <div className="flex flex-col gap-3">
          {developments.map((dev) => (
            <div key={dev.id} className="flex items-start gap-3">
              {/* Dot — fixed width container so cards always align */}
              <div className="flex-shrink-0 w-4 flex justify-center mt-[18px]">
                <div
                  className={`rounded-full border-2 ${
                    dev.is_turning_point ? "w-4 h-4" : "w-3 h-3"
                  }`}
                  style={{
                    borderColor: dev.source_color,
                    backgroundColor: dev.is_turning_point
                      ? dev.source_color
                      : "transparent",
                    boxShadow: dev.is_turning_point
                      ? `0 0 8px ${dev.source_color}60`
                      : "none",
                  }}
                />
              </div>
              {/* Card */}
              <div className="flex-1 min-w-0">
                <TimelineCard development={dev} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
