import { supabase } from "@/lib/supabase";
import { Story } from "@/lib/types";
import HomeContent from "@/components/HomeContent";
import { auth, signOut } from "@/auth";

export const revalidate = 0;

export default async function Home() {
  const session = await auth();

  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, title, subtitle, event_query, status, category, tags, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <main className="min-h-screen px-4 py-12 md:py-24">
      <div className="absolute top-4 right-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/sign-in" });
          }}
          className="flex items-center gap-3"
        >
          <span className="text-text-secondary text-sm">
            {session?.user?.email}
          </span>
          <button
            type="submit"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

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
