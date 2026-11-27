import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { env } from "@/lib/env";
import { User, type IUser } from "@/models/User";
import { RoleChangeLog } from "@/models/RoleChangeLog";
import { isStaffRole, isAdminRole, type UserRole } from "./rbac";

export const SESSION_COOKIE_NAME = "aura_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  emailVerified: boolean;
  role: UserRole;
  isBlocked: boolean;
}

function mapUser(doc: IUser): SessionUser {
  return {
    id: doc._id.toString(),
    firebaseUid: doc.firebaseUid,
    email: doc.email,
    name: doc.name,
    phone: doc.phone,
    photoURL: doc.photoURL,
    emailVerified: doc.emailVerified,
    role: doc.role,
    isBlocked: doc.isBlocked,
  };
}

export async function syncFirebaseUserToMongo(params: {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  photoURL?: string;
}): Promise<IUser> {
  await connectDB();
  const normalizedEmail = params.email.trim().toLowerCase();

  let user = await User.findOne({
    $or: [{ firebaseUid: params.uid }, { email: normalizedEmail }],
  });

  const shouldBootstrapAdmin =
    Boolean(env.initialAdminEmail) &&
    normalizedEmail === env.initialAdminEmail &&
    params.emailVerified === true;

  if (!user) {
    const initialRole: UserRole = shouldBootstrapAdmin ? "admin" : "user";
    user = await User.create({
      firebaseUid: params.uid,
      email: normalizedEmail,
      name: params.name?.trim() || normalizedEmail.split("@")[0] || "Customer",
      photoURL: params.photoURL,
      emailVerified: params.emailVerified,
      role: initialRole,
    });

    if (initialRole === "admin") {
      await RoleChangeLog.create({
        targetUserId: user._id,
        targetEmail: user.email,
        changedByUserId: user._id,
        changedByEmail: "system:INITIAL_ADMIN_EMAIL",
        previousRole: "user",
        newRole: "admin",
        reason: "Bootstrap initial admin from verified INITIAL_ADMIN_EMAIL",
      });
    }
    return user;
  }

  let dirty = false;
  if (user.firebaseUid !== params.uid) {
    user.firebaseUid = params.uid;
    dirty = true;
  }
  if (user.emailVerified !== params.emailVerified) {
    user.emailVerified = params.emailVerified;
    dirty = true;
  }
  if (params.photoURL && !user.photoURL) {
    user.photoURL = params.photoURL;
    dirty = true;
  }
  if (params.name && (!user.name || user.name === "Customer")) {
    user.name = params.name;
    dirty = true;
  }

  // Promote INITIAL_ADMIN_EMAIL only if verified and no other admin has downgraded it deliberately
  if (shouldBootstrapAdmin && user.role !== "admin") {
    const existingAdminCount = await User.countDocuments({ role: "admin" });
    if (existingAdminCount === 0) {
      const prev = user.role;
      user.role = "admin";
      dirty = true;
      await RoleChangeLog.create({
        targetUserId: user._id,
        targetEmail: user.email,
        changedByUserId: user._id,
        changedByEmail: "system:INITIAL_ADMIN_EMAIL",
        previousRole: prev,
        newRole: "admin",
        reason: "Bootstrap initial admin from verified INITIAL_ADMIN_EMAIL",
      });
    }
  }

  if (dirty) {
    await user.save();
  }
  return user;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    await connectDB();
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    if (!user) return null;
    if (user.isBlocked) return null;

    return {
      id: user._id.toString(),
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      photoURL: user.photoURL,
      emailVerified: Boolean(decoded.email_verified ?? user.emailVerified),
      role: user.role,
      isBlocked: user.isBlocked,
    };
  } catch {
    return null;
  }
}

export async function requireAuthForApi(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export async function requireStaffForApi(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) return null;
  return user;
}

export async function requireAdminForApi(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) return null;
  return user;
}

export async function requireUserPage(redirectTo = "/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export async function requireStaffPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  if (!isStaffRole(user.role)) {
    redirect("/account");
  }
  return user;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard/users");
  }
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export { mapUser };
