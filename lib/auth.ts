import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    {
      id: "linkedin",
      name: "LinkedIn",
      type: "oauth",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email w_member_social",
          response_type: "code",
        },
      },
      token: "https://www.linkedin.com/oauth/v2/accessToken",
      userinfo: "https://api.linkedin.com/v2/userinfo",
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    // Persist the LinkedIn access_token + expiry so API routes can use it for posting
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.linkedinId = account.providerAccountId;
        // LinkedIn tokens last 60 days — store expiry for proactive refresh warning
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 60 * 24 * 60 * 60 * 1000;
      }

      // Token expired — force sign-out on next request
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        return { ...token, error: "TokenExpired" };
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.linkedinId = token.linkedinId as string;
      if (token.error === "TokenExpired") {
        // Signal the client to re-authenticate
        session.error = "TokenExpired";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
