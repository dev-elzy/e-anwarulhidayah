import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      ustadzId?: string | null;
      waliId?: string | null;
      mustChangePassword?: boolean;
      rememberMe?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    ustadzId?: string | null;
    waliId?: string | null;
    mustChangePassword?: boolean;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    ustadzId?: string | null;
    waliId?: string | null;
    mustChangePassword?: boolean;
    rememberMe?: boolean;
  }
}
