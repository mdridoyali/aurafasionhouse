import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  getCurrentUser,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  syncFirebaseUserToMongo,
} from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const sessionSchema = z.object({
  idToken: z.string().min(20),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`auth:session:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return jsonError("Too many authentication attempts. Please try again shortly.", 429);
    }

    if (!isFirebaseAdminConfigured()) {
      return jsonError("Authentication service is not configured yet.", 503);
    }

    const body = await request.json();
    const { idToken } = sessionSchema.parse(body);

    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);

    if (!decoded.email) {
      return jsonError("Authenticated account must have an email address.", 400);
    }

    const user = await syncFirebaseUserToMongo({
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: Boolean(decoded.email_verified),
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      photoURL: typeof decoded.picture === "string" ? decoded.picture : undefined,
    });

    if (user.isBlocked) {
      return jsonError("Your account has been suspended. Please contact support.", 403);
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return jsonOk({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (existing && isFirebaseAdminConfigured()) {
      try {
        const auth = getFirebaseAdminAuth();
        const decoded = await auth.verifySessionCookie(existing);
        await auth.revokeRefreshTokens(decoded.sub);
      } catch {
        // Ignore invalid cookie on logout
      }
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return jsonOk({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
