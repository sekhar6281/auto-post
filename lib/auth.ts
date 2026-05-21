import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    LinkedIn({
      clientId:     process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email w_member_social",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.linkedinId  = account.providerAccountId;
        token.expiresAt   = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 60 * 24 * 60 * 60 * 1000;
      }

      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        return { ...token, error: "TokenExpired" };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.linkedinId  = token.linkedinId  as string;
      if (token.error === "TokenExpired") {
        session.error = "TokenExpired";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
