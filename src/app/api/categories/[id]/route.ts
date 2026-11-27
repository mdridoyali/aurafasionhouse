import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { categorySchema } from "@/lib/validators";
import { slugify } from "@/lib/format";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

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
    const parsed = categorySchema.parse(body);

    await connectDB();
    const updated = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          ...parsed,
          slug: slugify(parsed.slug || parsed.name),
          parent: parsed.parent ? new Types.ObjectId(parsed.parent) : null,
        },
      },
      { new: true }
    );
    if (!updated) return jsonError("Category not found", 404);

    return jsonOk({ category: updated });
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
    const inUse = await Product.exists({
      $or: [{ category: id }, { subcategory: id }],
      isDeleted: false,
    });
    if (inUse) {
      return jsonError("Cannot delete a category that still has active products.", 409);
    }

    await Category.deleteOne({ _id: id });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
