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
    <div className="flex justify-center mb-8">
      <button
        onClick={handleExport}
        disabled={exporting}
        className="font-mono text-xs uppercase tracking-wider text-text-secondary border border-timeline-line rounded px-4 py-2 hover:bg-bg-card hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export PNG"}
      </button>
    </div>
  );
}
