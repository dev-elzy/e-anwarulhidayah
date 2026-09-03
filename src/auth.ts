import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { verifyPassword } from "@/utils/crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;
        
        try {
          const db = getDb();
          if (!db) return null;
          const cleanUsername = String(credentials.username).trim();
          const cleanPassword = String(credentials.password).trim();

          const userList = await db.select().from(users).where(
            sql`LOWER(${users.username}) = LOWER(${cleanUsername})`
          ).limit(1);

          const foundUser = userList[0];
          
          if (!foundUser || !foundUser.active) return null;
          
          const passwordMatches = await verifyPassword(cleanPassword, foundUser.passwordHash);
          if (!passwordMatches) return null;
          
          return {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.roleId,
            ustadzId: foundUser.ustadzId,
            waliId: foundUser.waliId,
            mustChangePassword: foundUser.mustChangePassword,
            rememberMe: credentials.rememberMe === "true"
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      }
    })
  ]
});
