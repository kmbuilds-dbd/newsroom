"use client";

import { useState } from "react";
import html2canvas from "html2canvas";

export default function ExportButton() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const element = document.getElementById("timeline-export-area");
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: "#0f0f1a",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = "timeline.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary border border-white/[0.08] hover:border-[var(--text-secondary)] rounded transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      {exporting ? "Exporting\u2026" : "Export PNG"}
    </button>
  );
}
