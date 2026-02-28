import { Story } from "@/lib/types";

interface StoryHeaderProps {
  story: Story;
}

export default function StoryHeader({ story }: StoryHeaderProps) {
  return (
    <header className="text-center mb-16 pt-12">
      <div className="flex items-center justify-center gap-2 mb-4">
        {story.status === "developing" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Developing
          </span>
        )}
        {story.status === "concluded" && (
          <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">
            Concluded
          </span>
        )}
      </div>

      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold italic mb-4">
        {story.title}
      </h1>

      <p className="text-text-secondary text-lg max-w-2xl mx-auto">
        {story.subtitle}
      </p>
    </header>
  );
}
