"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const { story_id } = await res.json();
      router.push(`/story/${story_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a news event..."
          disabled={loading}
          className="w-full bg-bg-card border border-timeline-line rounded-lg px-6 py-4 text-lg text-text-primary placeholder-text-secondary font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {loading && (
        <p className="text-center text-text-secondary text-sm mt-4 font-mono">
          Researching event and building timeline...
        </p>
      )}

      {error && (
        <p className="text-center text-red-400 text-sm mt-4">{error}</p>
      )}
    </form>
  );
}
