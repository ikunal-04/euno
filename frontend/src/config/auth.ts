import { createClient } from "@/lib/db/server";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next"
import type { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Test user credentials
                if (credentials.email === "test@example.com" && credentials.password === "test123") {
                    return {
                        id: "test-user-123",
                        email: "test@example.com",
                        name: "Test User",
                        image: null,
                    };
                }

                return null;
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }: { user: any, account: any }) {
            if (!user.email) return false;

            try {
                const supabase = await createClient();
                const { data: existingUser, error: checkError } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", user.email)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') {
                    console.error("error from database")
                    return false;
                }

                if (!existingUser) {
                    const { error: insertError } = await supabase.from("users").insert({
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        imageUrl: user.image,
                        plans: "FREE"
                    });

                    if (insertError) {
                        console.error("Database insert error:", insertError);
                        return false;
                    }
                }

                return true;
            } catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },
        async jwt({ token, account }: { token: any, account: any }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.accessToken = token.accessToken;
            }
            return session;
        },
        async redirect() {
            return '/'
        }
    }
} satisfies NextAuthOptions;

export function auth(
    ...args:
        | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
        | [NextApiRequest, NextApiResponse]
        | []
) {
    return getServerSession(...args, authOptions)
}
