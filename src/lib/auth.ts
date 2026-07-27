import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { readTab } from "@/lib/sheets/client";
import { TABS } from "@/lib/sheets/schema";
import type { AdminRow } from "@/lib/sheets/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const admins = await readTab<AdminRow>(TABS.admins);
      return admins.some((a) => a.email.toLowerCase() === user.email!.toLowerCase());
    },
    async jwt({ token }) {
      if (token.email) {
        const admins = await readTab<AdminRow>(TABS.admins);
        const admin = admins.find((a) => a.email.toLowerCase() === token.email!.toLowerCase());
        token.role = admin?.role ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as "superadmin" | "admin" | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

/** Returns the signed-in admin's profile (email + role), or null if not signed in / not an admin. */
export async function getCurrentProfile() {
  const session = await auth();
  if (!session?.user?.email || !session.user.role) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role: session.user.role as "superadmin" | "admin",
  };
}
