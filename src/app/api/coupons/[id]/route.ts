import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Coupon } from "@/models/Coupon";
import { couponSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    const body = await request.json();
    const parsed = couponSchema.parse(body);

    await connectDB();
    const updated = await Coupon.findByIdAndUpdate(
      id,
      { $set: { ...parsed, expiresAt: new Date(parsed.expiresAt) } },
      { new: true }
    );
    if (!updated) return jsonError("Coupon not found", 404);
    return jsonOk({ coupon: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    await connectDB();
    await Coupon.deleteOne({ _id: id });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
