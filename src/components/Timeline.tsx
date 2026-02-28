import { Development } from "@/lib/types";
import TimelineCard from "./TimelineCard";

interface TimelineProps {
  developments: Development[];
}

export default function Timeline({ developments }: TimelineProps) {
  return (
    <div className="relative max-w-5xl mx-auto px-4">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-timeline-line -translate-x-1/2" />

      {developments.map((dev, index) => (
        <TimelineCard
          key={dev.id}
          development={dev}
          side={index % 2 === 0 ? "left" : "right"}
        />
      ))}
    </div>
  );
}
