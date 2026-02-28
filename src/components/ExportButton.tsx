"use client";

export default function ExportButton() {
  return (
    <div className="flex justify-center mb-8">
      <button className="font-mono text-xs uppercase tracking-wider text-text-secondary border border-timeline-line rounded px-4 py-2 hover:bg-bg-card hover:text-text-primary transition-colors">
        Export PNG
      </button>
    </div>
  );
}
