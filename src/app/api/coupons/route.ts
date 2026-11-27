import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Coupon } from "@/models/Coupon";
import { couponSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return jsonOk({ coupons });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = couponSchema.parse(body);

    await connectDB();
    const coupon = await Coupon.create({
      ...parsed,
      expiresAt: new Date(parsed.expiresAt),
    });
    return jsonOk({ coupon }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
