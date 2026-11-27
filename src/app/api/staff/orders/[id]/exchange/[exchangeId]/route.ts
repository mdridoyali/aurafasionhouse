import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Order } from "@/models/Order";
import { approveExchangeVariantStock } from "@/lib/inventory";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  staffNote: z.string().trim().max(300).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; exchangeId: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id, exchangeId } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid order ID.", 400);

    const body = await request.json();
    const { decision, staffNote } = decisionSchema.parse(body);

    await connectDB();
    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) throw new Error("Order not found.");

        if (decision === "approved") {
          await approveExchangeVariantStock({
            order,
            exchangeId,
            staffId: new Types.ObjectId(staff.id),
            staffNote,
            session,
          });
        } else {
          const ex = order.exchangeRequests.find((e) => e._id.toString() === exchangeId);
          if (!ex) throw new Error("Exchange request not found.");
          if (ex.status !== "pending") throw new Error("Exchange request already resolved.");
          ex.status = "rejected";
          ex.staffNote = staffNote;
          ex.resolvedAt = new Date();
          ex.resolvedBy = new Types.ObjectId(staff.id);
          await order.save({ session });
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
