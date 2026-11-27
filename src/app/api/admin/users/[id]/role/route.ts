import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdminForApi } from "@/lib/auth/session";
import { User } from "@/models/User";
import { RoleChangeLog } from "@/models/RoleChangeLog";
import { roleChangeSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminForApi();
    if (!admin) return jsonError("Forbidden: Admin access required.", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid user ID.", 400);

    const body = await request.json();
    const { role: newRole, reason } = roleChangeSchema.parse(body);

    await connectDB();
    const target = await User.findById(id);
    if (!target) return jsonError("User not found.", 404);

    if (target.role === newRole) {
      return jsonOk({ user: target });
    }

    // Last remaining admin can never be removed or demoted
    if (target.role === "admin" && newRole !== "admin") {
      const activeAdmins = await User.countDocuments({ role: "admin", isBlocked: false });
      if (activeAdmins <= 1) {
        return jsonError("The last remaining admin can never be removed or demoted.", 400);
      }
    }

    const previousRole = target.role;
    target.role = newRole;
    await target.save();

    await RoleChangeLog.create({
      targetUserId: target._id,
      targetEmail: target.email,
      changedByUserId: new Types.ObjectId(admin.id),
      changedByEmail: admin.email,
      previousRole,
      newRole,
      reason: reason || `Role updated from ${previousRole} to ${newRole}`,
    });

    return jsonOk({
      user: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
