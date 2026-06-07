/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Prisma Client — Singleton Instance                         ║
 * ║  Prevents multiple Prisma connections during hot-reload      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from "@prisma/client";

// Extend globalThis to store the Prisma instance across hot-reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance.
 * In development, the instance is cached on `globalThis` to prevent
 * creating a new connection pool on every hot-reload.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
