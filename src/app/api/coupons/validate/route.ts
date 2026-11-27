import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { Coupon } from "@/models/Coupon";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const validateSchema = z.object({
  code: z.string().trim().min(2).transform((v) => v.toUpperCase()),
  subtotal: z.coerce.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Please sign in to apply a coupon.", 401);

    const body = await request.json();
    const { code, subtotal } = validateSchema.parse(body);

    await connectDB();
    const coupon = await Coupon.findOne({ code, isActive: true }).lean();
    if (!coupon) return jsonError("Invalid or inactive coupon code.", 404);

    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return jsonError("This coupon has expired.", 400);
    }

    if (subtotal < coupon.minOrderAmount) {
      return jsonError(`Minimum order of ৳${coupon.minOrderAmount} required for this coupon.`, 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return jsonError("This coupon has reached its total usage limit.", 400);
    }

    const userUsage = coupon.usedBy.find((u) => u.userId.toString() === user.id);
    if (userUsage && userUsage.count >= coupon.perUserLimit) {
      return jsonError("You have already used this coupon the maximum number of times.", 400);
    }

    let discount =
      coupon.type === "percent"
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.round(coupon.value);

    if (coupon.type === "percent" && coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(discount, subtotal);

    return jsonOk({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      description: coupon.description,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
