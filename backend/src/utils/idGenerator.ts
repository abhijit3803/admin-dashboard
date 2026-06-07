/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ID Generator — 10-Digit Zero-Padded Numeric Strings        ║
 * ║  Collision-checked against the database                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { randomInt } from "crypto";
import prisma from "../lib/prisma.js";

/** Maximum value for a 10-digit number */
const MAX_ID = 9_999_999_999;

/** Minimum value (ensures 10 digits when padded) */
const MIN_ID = 0;

/** Maximum collision-check retry attempts */
const MAX_RETRIES = 10;

/**
 * Generates a random 10-digit zero-padded numeric string.
 * Does NOT check for collisions — use `generateUniqueId` instead.
 */
function generateRandomId(): string {
  const num = randomInt(MIN_ID, MAX_ID + 1);
  return num.toString().padStart(10, "0");
}

/**
 * Which Prisma model tables to check for ID collisions.
 * Maps a table name to its Prisma delegate.
 */
type IdTable = "ingredient" | "recipe";

/**
 * Generates a unique 10-digit zero-padded numeric string ID.
 * Checks for collisions against the specified database table.
 *
 * @param table - The Prisma model table to check against
 * @returns A unique 10-digit ID string (e.g., "0000000042")
 * @throws Error if a unique ID cannot be generated after MAX_RETRIES attempts
 */
export async function generateUniqueId(table: IdTable): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const id = generateRandomId();

    // Check if the ID already exists in the specified table
    let existing: { id: string } | null = null;

    if (table === "ingredient") {
      existing = await prisma.ingredient.findUnique({
        where: { id },
        select: { id: true },
      });
    } else if (table === "recipe") {
      existing = await prisma.recipe.findUnique({
        where: { id },
        select: { id: true },
      });
    }

    if (!existing) {
      return id;
    }
  }

  throw new Error(
    `Failed to generate a unique ID for table "${table}" after ${MAX_RETRIES} attempts. ` +
      `This is extremely unlikely and may indicate a problem with the ID space.`
  );
}
