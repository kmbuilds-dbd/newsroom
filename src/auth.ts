import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const { data } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", user.email)
        .single();
      return !!data;
    },
  },
});
