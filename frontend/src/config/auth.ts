import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db/server";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      console.log("🔍 signIn callback:", { email: user?.email, accountType: account?.type, userId: user?.id });
      if (!user.email) return false;

      try {
        const sql = db();
        const [existingUser] = await sql<{ id: number }[]>`
                    SELECT id
                    FROM users
                    WHERE email = ${user.email}
                    LIMIT 1
                `;
        console.log("🔍 existing user check:", existingUser);

        if (!existingUser) {
          const insertResult = await sql`
                        INSERT INTO users ("userId", email, name, "imageUrl", plans)
                        VALUES (${user.id}, ${user.email}, ${user.name ?? null}, ${user.image ?? null}, ${"FREE"}::user_plan)
                    `;
          console.log("🔍 user inserted:", insertResult);
        }

        return true;
      } catch (error) {
        console.error("❌ SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, account, user }: { token: any; account: any; user: any }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.user_id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.userId = token.user_id;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthOptions;

export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}
