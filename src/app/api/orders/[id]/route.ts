import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/rbac";
import { Order } from "@/models/Order";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    await connectDB();

    const query = Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query).lean();
    if (!order) return jsonError("Order not found.", 404);

    if (order.userId.toString() !== user.id && !isStaffRole(user.role)) {
      return jsonError("Forbidden", 403);
    }

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
