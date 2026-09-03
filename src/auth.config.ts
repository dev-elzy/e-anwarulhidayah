import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

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
  secret: process.env.AUTH_SECRET || (() => {
    if (process.env.NODE_ENV === "production") {
      // Selama proses build di CI/CD (Next.js build phase atau Cloudflare Pages build),
      // AUTH_SECRET belum diikat (bound). Kita berikan placeholder sementara agar kompilasi build sukses.
      if (
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.CI ||
        process.env.CF_PAGES === "1"
      ) {
        console.warn("⚠️  AUTH_SECRET tidak tersedia selama proses build. Menggunakan placeholder sementara.");
        return "temporary-build-placeholder-only-value";
      }
      throw new Error("AUTH_SECRET environment variable wajib di-set di production! Gunakan: wrangler secret put AUTH_SECRET");
    }
    // Hanya untuk development lokal — jangan gunakan di production
    console.warn("⚠️  AUTH_SECRET tidak di-set. Menggunakan nilai sementara untuk development.");
    return "dev-only-placeholder-not-for-production-use";
  })()
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);
