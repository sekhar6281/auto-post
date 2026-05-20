import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    linkedinId: string;
    error?: "TokenExpired";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    linkedinId?: string;
    expiresAt?: number;
    error?: "TokenExpired";
  }
}
