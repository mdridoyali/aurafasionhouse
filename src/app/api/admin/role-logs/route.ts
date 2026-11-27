import { connectDB } from "@/lib/db";
import { requireAdminForApi } from "@/lib/auth/session";
import { RoleChangeLog } from "@/models/RoleChangeLog";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const admin = await requireAdminForApi();
    if (!admin) return jsonError("Forbidden: Admin access required.", 403);

    await connectDB();
    const logs = await RoleChangeLog.find().sort({ createdAt: -1 }).limit(100).lean();
    return jsonOk({ logs });
  } catch (err) {
    return handleApiError(err);
  }
}
