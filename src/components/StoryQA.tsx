"use client";

import { useState } from "react";

interface QAPair {
  q: string;
  a: string;
}

interface StoryQAProps {
  storyId: string;
  storyTitle: string;
}

export default function StoryQA({ storyId, storyTitle }: StoryQAProps) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QAPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stories/${storyId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get answer");
      }

      const { answer } = await res.json();
      setHistory((prev) => [{ q, a: answer }, ...prev]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 mt-16 mb-12">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-secondary mb-4">
        Ask about this topic
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask a question about ${storyTitle}...`}
            disabled={loading}
            className="w-full bg-bg-card border border-white/[0.06] rounded-lg px-5 py-3 text-sm text-text-primary placeholder-text-secondary font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </form>

      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}

      {history.length > 0 && (
        <div className="mt-6 space-y-4">
          {history.map((pair, i) => (
            <div
              key={i}
              className="bg-bg-card border border-white/[0.06] rounded-lg p-5"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary mb-2">
                Q
              </p>
              <p className="text-text-primary text-sm mb-4">{pair.q}</p>
              <p className="font-mono text-xs uppercase tracking-widest text-text-secondary mb-2">
                A
              </p>
              <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {pair.a}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
