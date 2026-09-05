import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function resolveAuthSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;

  try {
    const cf = getCloudflareContext();
    if (cf?.env && "AUTH_SECRET" in cf.env && typeof cf.env.AUTH_SECRET === "string") {
      return cf.env.AUTH_SECRET;
    }
    if (cf?.env && "NEXTAUTH_SECRET" in cf.env && typeof cf.env.NEXTAUTH_SECRET === "string") {
      return cf.env.NEXTAUTH_SECRET;
    }
  } catch {
    // Di luar Cloudflare context
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️  AUTH_SECRET belum di-set di environment Cloudflare! Gunakan: wrangler secret put AUTH_SECRET");
    return "e-anwarulhidayah-prod-fallback-secret-key-2026";
  }

  return "dev-only-placeholder-not-for-production-use";
}

export const authConfig = {
  trustHost: true,
  providers: [], // Added dynamically in auth.ts
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.ustadzId = (user as any).ustadzId;
        token.waliId = (user as any).waliId;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.rememberMe = (user as any).rememberMe;
      }
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).ustadzId = token.ustadzId;
        (session.user as any).waliId = token.waliId;
        (session.user as any).mustChangePassword = token.mustChangePassword;
        (session.user as any).rememberMe = token.rememberMe;
      }
      return session;
    }
  },
  secret: resolveAuthSecret(),
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
