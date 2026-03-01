"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RefreshButtonProps {
  storyId: string;
}

export default function RefreshButton({ storyId }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stories/${storyId}/regenerate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Regeneration failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleRegenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary border border-white/[0.08] hover:border-[var(--text-secondary)] rounded transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
      >
        <svg
          className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {loading ? "Regenerating\u2026" : "Refresh"}
      </button>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </>
  );
}
