"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  storyId: string;
}

export default function DeleteButton({ storyId }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <>
        <span className="text-xs font-mono text-red-400">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 rounded transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:outline-none"
        >
          {loading ? "Deleting\u2026" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-primary border border-white/[0.08] hover:border-[var(--text-secondary)] rounded transition-all duration-150 ease-out disabled:opacity-40 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 rounded transition-all duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Delete
    </button>
  );
}
