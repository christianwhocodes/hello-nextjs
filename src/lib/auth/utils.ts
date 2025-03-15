import { db } from "@/lib/prisma/connection";
import type { users as User } from "@prisma/client";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./config";

export function hash(suppliedString: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(suppliedString, salt, 1000, 64, "sha512").toString(
    "hex",
  );
  return `${salt}:${hash}`;
}

function hashCompare(storedHash: string, suppliedString: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const suppliedHash = pbkdf2Sync(
    suppliedString,
    salt,
    1000,
    64,
    "sha512",
  ).toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(suppliedHash));
}

async function getUser(email: string): Promise<User | undefined> {
  // * This isn't used in a client component, hence not in data.ts
  try {
    const user = await db.users.findMany({
      where: { email },
    });
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = hashCompare(user.password, password);

          if (passwordsMatch) return user;
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
