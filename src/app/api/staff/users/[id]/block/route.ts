import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { canBlockTargetUser } from "@/lib/auth/rbac";
import { User } from "@/models/User";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const blockSchema = z.object({
  isBlocked: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid user ID.", 400);

    const body = await request.json();
    const { isBlocked } = blockSchema.parse(body);

    await connectDB();
    const target = await User.findById(id);
    if (!target) return jsonError("User not found.", 404);

    if (!canBlockTargetUser(staff.role, staff.id, target._id.toString(), target.role)) {
      return jsonError(
        "Forbidden: you do not have permission to block or unblock this account.",
        403
      );
    }

    // Never allow blocking the last active admin
    if (isBlocked && target.role === "admin") {
      const otherAdmins = await User.countDocuments({
        role: "admin",
        isBlocked: false,
        _id: { $ne: target._id },
      });
      if (otherAdmins === 0) {
        return jsonError("Cannot block the last remaining active admin.", 400);
      }
    }

    target.isBlocked = isBlocked;
    await target.save();

    return jsonOk({
      user: {
        _id: target._id,
        email: target.email,
        role: target.role,
        isBlocked: target.isBlocked,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
