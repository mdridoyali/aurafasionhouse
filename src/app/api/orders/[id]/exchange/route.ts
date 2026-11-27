import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { Order } from "@/models/Order";
import { exchangeRequestSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid order ID.", 400);

    const body = await request.json();
    const parsed = exchangeRequestSchema.parse(body);

    await connectDB();
    const order = await Order.findById(id);
    if (!order) return jsonError("Order not found.", 404);
    if (order.userId.toString() !== user.id) return jsonError("Forbidden", 403);
    if (order.orderStatus !== "delivered") {
      return jsonError("Size exchange can only be requested for delivered orders.", 400);
    }

    const item = order.items.find((i) => i.sku === parsed.itemSku.toUpperCase());
    if (!item) return jsonError("Item not found in this order.", 404);

    if (order.exchangeRequests.some((ex) => ex.itemSku === item.sku && ex.status === "pending")) {
      return jsonError("An exchange request is already pending for this item.", 409);
    }

    const exchange = {
      itemSku: item.sku,
      requestedSize: parsed.requestedSize,
      requestedColor: parsed.requestedColor,
      reason: parsed.reason,
      status: "pending",
      createdAt: new Date(),
    };
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: "delivered", exchangeRequests: { $not: { $elemMatch: { itemSku: item.sku, status: "pending" } } } },
      { $push: { exchangeRequests: exchange } },
      { new: true, runValidators: true }
    );
    if (!updated) return jsonError("Order changed or an exchange is already pending.", 409);
    return jsonOk({ order: updated }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
