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
    <main className="min-h-screen">
      {/* Top header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-timeline-line">
        <h1 className="font-serif text-2xl font-bold italic">Newsroom</h1>
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

      <HomeContent stories={(stories as Story[]) || []} />
    </main>
  );
}
