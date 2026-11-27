import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Review } from "@/models/Review";
import { recalculateProductRating } from "@/app/api/reviews/route";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const modSchema = z.object({
  isApproved: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    const body = await request.json();
    const { isApproved } = modSchema.parse(body);

    await connectDB();
    const updated = await Review.findByIdAndUpdate(
      id,
      { $set: { isApproved } },
      { new: true }
    );
    if (!updated) return jsonError("Review not found", 404);

    await recalculateProductRating(updated.productId);
    return jsonOk({ review: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    await connectDB();
    const review = await Review.findByIdAndDelete(id);
    if (review) {
      await recalculateProductRating(review.productId);
    }
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
