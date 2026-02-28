import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import StoryList from "@/components/StoryList";

export const revalidate = 0;

export default async function Home() {
  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl md:text-6xl font-bold italic mb-4">
          Newsroom
        </h1>
        <p className="text-text-secondary text-lg">
          Understand any news event in depth. Enter an event to build its
          timeline.
        </p>
      </div>

      <SearchBar />
      <StoryList stories={(stories as Story[]) || []} />
    </main>
  );
}
