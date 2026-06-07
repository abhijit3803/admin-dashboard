/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Auth Middleware — JWT Token Verification                    ║
 * ║  Verifies NextAuth.js session tokens                        ║
 * ║  Skippable in development via SKIP_AUTH=true env var         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { Request, Response, NextFunction } from "express";
import { createHmac } from "crypto";
import { AppError } from "../types/index.js";

/**
 * Decodes a base64url-encoded string to UTF-8 text.
 */
function base64UrlDecode(input: string): string {
  // Convert base64url to standard base64
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' if necessary
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Minimal JWT verification using HMAC-SHA256 (HS256).
 * NextAuth.js uses the NEXTAUTH_SECRET to sign JWTs.
 *
 * NOTE: For production with advanced JWT features (JWE, RS256, etc.),
 * consider using the `jose` library. This is a minimal implementation
 * suitable for HS256-signed NextAuth tokens.
 */
function verifyJwt(
  token: string,
  secret: string
): { sub: string; email: string; name?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(data)
      .digest("base64url");

    if (expectedSignature !== signatureB64) return null;

    // Decode and parse payload
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as {
      sub?: string;
      email?: string;
      name?: string;
      exp?: number;
    };

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (!payload.sub || !payload.email) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Express middleware that verifies the JWT from the Authorization header.
 *
 * Behavior:
 * - If `SKIP_AUTH=true` is set in environment, all requests pass through
 *   with a mock dev user attached to `req.user`.
 * - Otherwise, extracts the Bearer token from the Authorization header,
 *   verifies it against NEXTAUTH_SECRET, and attaches the user to `req.user`.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // ── Dev Mode: Skip authentication ────────────
  if (process.env.SKIP_AUTH === "true") {
    // Note: id is undefined because no User record exists in dev mode.
    // Services handle undefined userId by setting createdById/updatedById to null.
    req.user = {
      id: undefined as unknown as string,
      email: "dev@frescoo.local",
      name: "Dev User",
    };
    next();
    return;
  }

  // ── Extract Bearer token ─────────────────────
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Please provide a valid token.", 401);
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // ── Verify JWT ───────────────────────────────
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[Auth] NEXTAUTH_SECRET is not configured.");
    throw new AppError("Server authentication is misconfigured.", 500);
  }

  const decoded = verifyJwt(token, secret);

  if (!decoded) {
    throw new AppError("Invalid or expired authentication token.", 401);
  }

  // ── Attach user to request ───────────────────
  req.user = {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name,
  };

  next();
}
