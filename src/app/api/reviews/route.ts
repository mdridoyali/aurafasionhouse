import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi, requireStaffForApi } from "@/lib/auth/session";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { reviewSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function recalculateProductRating(productId: Types.ObjectId) {
  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { productId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const ratingAvg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const ratingCount = agg[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, { $set: { ratingAvg, ratingCount } });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const productId = request.nextUrl.searchParams.get("productId");
    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "staff") {
      const staff = await requireStaffForApi();
      if (!staff) return jsonError("Forbidden", 403);
      const reviews = await Review.find()
        .populate("productId", "name slug")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return jsonOk({ reviews });
    }

    const filter: Record<string, unknown> = { isApproved: true };
    if (productId && Types.ObjectId.isValid(productId)) {
      filter.productId = new Types.ObjectId(productId);
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).limit(30).lean();
    return jsonOk({ reviews });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Please sign in to leave a review.", 401);

    const body = await request.json();
    const parsed = reviewSchema.parse(body);
    if (!Types.ObjectId.isValid(parsed.productId)) return jsonError("Invalid product ID.", 400);

    await connectDB();
    const productObjectId = new Types.ObjectId(parsed.productId);

    // Only customers with a delivered order containing this product can review it
    const deliveredOrder = await Order.findOne({
      userId: new Types.ObjectId(user.id),
      orderStatus: "delivered",
      "items.productId": productObjectId,
    })
      .select("_id")
      .lean();

    if (!deliveredOrder) {
      return jsonError(
        "Only customers with a delivered order for this product can submit a review.",
        403
      );
    }

    const review = await Review.findOneAndUpdate(
      { productId: productObjectId, userId: new Types.ObjectId(user.id) },
      {
        $set: {
          orderId: deliveredOrder._id,
          userName: user.name,
          rating: parsed.rating,
          title: parsed.title,
          comment: parsed.comment,
          isApproved: true,
        },
      },
      { upsert: true, new: true }
    );

    await recalculateProductRating(productObjectId);
    return jsonOk({ review }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
