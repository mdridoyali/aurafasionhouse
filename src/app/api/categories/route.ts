import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { categorySchema } from "@/lib/validators";
import { slugify } from "@/lib/format";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const hideEmpty = request.nextUrl.searchParams.get("hideEmpty") === "true";
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";

    if (includeInactive) {
      const staff = await requireStaffForApi();
      if (!staff) return jsonError("Forbidden", 403);
    }

    const filter = includeInactive ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();

    if (!hideEmpty) {
      return jsonOk({ categories });
    }

    const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { isDeleted: false, isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const subCounts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { isDeleted: false, isActive: true, subcategory: { $ne: null } } },
      { $group: { _id: "$subcategory", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const c of counts) countMap.set(c._id.toString(), c.count);
    for (const c of subCounts) countMap.set(c._id.toString(), (countMap.get(c._id.toString()) ?? 0) + c.count);

    const visible = categories
      .map((cat) => ({
        ...cat,
        productCount: countMap.get(cat._id.toString()) ?? 0,
      }))
      .filter((cat) => cat.productCount > 0);

    return jsonOk({ categories: visible });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = categorySchema.parse(body);

    await connectDB();
    const slug = slugify(parsed.slug || parsed.name);
    const category = await Category.create({
      ...parsed,
      slug,
      parent: parsed.parent ? new Types.ObjectId(parsed.parent) : null,
    });

    return jsonOk({ category }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
