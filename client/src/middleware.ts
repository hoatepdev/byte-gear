import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { USER_ROLE } from "./config.global";

const ADMIN_PATH = /^\/admin(\/|$)/;
const PROFILE_PATH = /^\/my-profile(\/|$)/;
const SETTINGS_PATH = /^\/settings(\/|$)/;

const SETTINGS_ROLE = USER_ROLE.CUSTOMER;

// SECURITY: JWT_SECRET should NOT be NEXT_PUBLIC_* (would expose to browser)
// This middleware runs on Next.js server edge, so we can use private env vars
// Support both JWT_SECRET and JWT_SECRET_KEY (match server naming)
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

/**
 * Safely decodes and verifies JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
const verifyToken = (token: string): { role?: string; sub?: string } | null => {
  try {
    // SECURITY FIX: Use jwt.verify() instead of jwt.decode()
    // jwt.decode() does NOT validate signature - allows forged tokens!
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured - falling back to decode only (INSECURE)");
      // Fallback to decode if secret not set (dev only)
      return jwt.decode(token) as { role?: string; sub?: string } | null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string; sub?: string };
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or signature mismatch
    return null;
  }
};

export const middleware = (req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("accessToken")?.value;

  if (ADMIN_PATH.test(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (PROFILE_PATH.test(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Verify token is valid (not just present)
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (SETTINGS_PATH.test(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== SETTINGS_ROLE) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/admin/:path*", "/my-profile", "/settings/:path*"],
};
