import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { bdPhoneRegex, normalizeBdPhone } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const trackSchema = z.object({
  orderNumber: z.string().trim().min(5).transform((v) => v.toUpperCase()),
  phone: z
    .string()
    .trim()
    .transform(normalizeBdPhone)
    .refine((v) => bdPhoneRegex.test(v), "Enter a valid 11-digit phone number."),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`order:track:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return jsonError("Too many tracking requests. Please wait a minute.", 429);
    }

    const body = await request.json();
    const { orderNumber, phone } = trackSchema.parse(body);

    await connectDB();
    const order = await Order.findOne({
      orderNumber,
      "shippingAddress.phone": phone,
    })
      .select(
        "orderNumber orderStatus paymentMethod paymentStatus deliveryZone subtotal discount deliveryCharge total statusHistory items createdAt shippingAddress.area shippingAddress.district"
      )
      .lean();

    if (!order) {
      return jsonError("No matching order found for that order number and phone.", 404);
    }

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
