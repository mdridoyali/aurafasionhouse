import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { User } from "@/models/User";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    await connectDB();
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const role = request.nextUrl.searchParams.get("role");

    const filter: Record<string, unknown> = {};
    if (role && ["user", "moderator", "admin"].includes(role)) {
      filter.role = role;
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email phone role isBlocked emailVerified createdAt photoURL")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return jsonOk({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
