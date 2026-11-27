import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/rbac";
import { Order } from "@/models/Order";
import { restoreOrderStockOnce } from "@/lib/inventory";
import { BusinessRuleError, handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const cancelSchema = z.object({
  reason: z.string().trim().min(3).max(300).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid order ID.", 400);

    const body = await request.json().catch(() => ({}));
    const { reason } = cancelSchema.parse(body);

    await connectDB();
    const isStaff = isStaffRole(user.role);

    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new BusinessRuleError("Order not found.", 404);

        if (order.userId.toString() !== user.id && !isStaff) {
          throw new BusinessRuleError("Forbidden", 403);
        }

        if (order.orderStatus === "cancelled") {
          updatedOrder = order;
          return;
        }

        if (order.orderStatus === "delivered" || order.orderStatus === "returned") {
          throw new BusinessRuleError("Delivered or returned orders cannot be cancelled.");
        }

        if (!isStaff && !["pending", "confirmed"].includes(order.orderStatus)) {
          throw new BusinessRuleError("Orders already in processing or shipped cannot be cancelled by customer.");
        }

        order.orderStatus = "cancelled";
        order.cancelReason = reason || (isStaff ? "Cancelled by staff" : "Cancelled by customer");
        order.cancelledBy = new Types.ObjectId(user.id);
        order.statusHistory.push({
          status: "cancelled",
          note: order.cancelReason,
          changedBy: new Types.ObjectId(user.id),
          changedAt: new Date(),
        });
        await order.save({ session });

        await restoreOrderStockOnce({
          order,
          reason: "order_cancelled",
          note: order.cancelReason,
          actorId: new Types.ObjectId(user.id),
          session,
        });

        updatedOrder = await Order.findById(order._id).session(session).lean();
      });
    } finally {
      await session.endSession();
    }

    return jsonOk({ order: updatedOrder });
  } catch (err) {
    if (err instanceof Error && err.message === "Forbidden") {
      return jsonError("Forbidden", 403);
    }
    return handleApiError(err);
  }
}
