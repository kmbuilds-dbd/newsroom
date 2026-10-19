import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import StoryHeader from "@/components/StoryHeader";
import Timeline from "@/components/Timeline";
import ExportButton from "@/components/ExportButton";
import RefreshButton from "@/components/RefreshButton";
import DeleteButton from "@/components/DeleteButton";
import StoryQA from "@/components/StoryQA";

export const revalidate = 0;

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (storyError || !story) {
    notFound();
  }

  const { data: developments } = await supabase
    .from("developments")
    .select("*")
    .eq("story_id", id)
    .order("date_sort", { ascending: true });

  const fullStory: Story = {
    ...story,
    developments: developments || [],
  };

  return (
    <main className="min-h-screen pb-24">
      <StoryHeader story={fullStory} />
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap px-4">
        <RefreshButton storyId={id} />
        <ExportButton />
        <DeleteButton storyId={id} />
      </div>
      <div id="timeline-export-area">
        <Timeline developments={fullStory.developments || []} />
      </div>
      <StoryQA storyId={id} storyTitle={fullStory.title} />
    </main>
  );
}
