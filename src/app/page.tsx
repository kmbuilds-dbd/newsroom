import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import HomeContent from "@/components/HomeContent";

export const revalidate = 0;

export default async function Home() {
  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, title, subtitle, event_query, status, category, tags, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <main className="min-h-screen px-4 py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl md:text-6xl font-bold italic mb-4">
          Newsroom
        </h1>
        <p className="text-text-secondary text-lg">
          Understand any news event in depth. Enter an event to build its
          timeline.
        </p>
      </div>

      <HomeContent stories={(stories as Story[]) || []} />
    </main>
  );
}
