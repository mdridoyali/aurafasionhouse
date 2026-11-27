import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Order } from "@/models/Order";
import { restoreOrderStockOnce } from "@/lib/inventory";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const verifySchema = z.object({
  decision: z.enum(["paid", "rejected"]),
  note: z.string().trim().max(300).optional(),
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
    const { decision, note } = verifySchema.parse(body);

    await connectDB();
    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new Error("Order not found.");

        if (decision === "paid") {
          order.paymentStatus = "paid";
          order.paymentDetails.verifiedBy = new Types.ObjectId(staff.id);
          order.paymentDetails.verifiedAt = new Date();
          if (order.orderStatus === "pending") {
            order.orderStatus = "confirmed";
            order.statusHistory.push({
              status: "confirmed",
              note: note || "Payment verified and order confirmed",
              changedBy: new Types.ObjectId(staff.id),
              changedAt: new Date(),
            });
          }
          await order.save({ session });
        } else {
          // Rejected payment cancels the order and restores stock!
          order.paymentStatus = "rejected";
          order.paymentDetails.verifiedBy = new Types.ObjectId(staff.id);
          order.paymentDetails.verifiedAt = new Date();
          order.paymentDetails.rejectionReason = note || "Payment could not be verified";
          order.orderStatus = "cancelled";
          order.cancelReason = `Payment rejected: ${order.paymentDetails.rejectionReason}`;
          order.cancelledBy = new Types.ObjectId(staff.id);
          order.statusHistory.push({
            status: "cancelled",
            note: order.cancelReason,
            changedBy: new Types.ObjectId(staff.id),
            changedAt: new Date(),
          });
          await order.save({ session });

          await restoreOrderStockOnce({
            order,
            reason: "payment_rejected",
            note: order.cancelReason,
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
