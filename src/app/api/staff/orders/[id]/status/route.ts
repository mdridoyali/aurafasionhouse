import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Order } from "@/models/Order";
import { restoreOrderStockOnce } from "@/lib/inventory";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const statusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
  note: z.string().trim().max(300).optional(),
  returnResellable: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid order ID.", 400);

    const body = await request.json();
    const parsed = statusUpdateSchema.parse(body);

    await connectDB();
    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new Error("Order not found.");

        if (parsed.status === "cancelled" && order.orderStatus === "delivered") {
          throw new Error("Delivered orders cannot be cancelled; mark as returned instead.");
        }

        order.orderStatus = parsed.status;
        if (parsed.status === "delivered" && order.paymentMethod === "cod" && order.paymentStatus === "unpaid") {
          order.paymentStatus = "paid";
        }

        if (parsed.status === "returned") {
          order.returnResellable = Boolean(parsed.returnResellable);
        }

        order.statusHistory.push({
          status: parsed.status,
          note: parsed.note || `Updated to ${parsed.status} by staff`,
          changedBy: new Types.ObjectId(staff.id),
          changedAt: new Date(),
        });

        await order.save({ session });

        if (parsed.status === "cancelled") {
          await restoreOrderStockOnce({
            order,
            reason: "order_cancelled",
            note: parsed.note || "Cancelled by staff",
            actorId: new Types.ObjectId(staff.id),
            session,
          });
        } else if (parsed.status === "returned" && parsed.returnResellable) {
          await restoreOrderStockOnce({
            order,
            reason: "order_returned_resellable",
            note: parsed.note || "Returned items marked resellable",
            actorId: new Types.ObjectId(staff.id),
            session,
          });
        }

        updatedOrder = await Order.findById(order._id).session(session).lean();
      });
    } finally {
      await session.endSession();
    }

    return jsonOk({ order: updatedOrder });
  } catch (err) {
    return handleApiError(err);
  }
}
