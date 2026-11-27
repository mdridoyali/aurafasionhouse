import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { manualAdjustVariantStock } from "@/lib/inventory";
import { stockAdjustmentSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    await connectDB();
    const settings = await getOrCreateStoreSettings();
    const threshold = settings.lowStockAlertThreshold || 5;

    const [products, movements] = await Promise.all([
      Product.find({ isDeleted: false })
        .select("name slug variants totalStock isActive")
        .sort({ totalStock: 1 })
        .lean(),
      StockMovement.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const lowStockVariants = [];
    const outOfStockVariants = [];

    for (const product of products) {
      for (const v of product.variants) {
        const entry = {
          productId: product._id.toString(),
          productName: product.name,
          slug: product.slug,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.stock,
          threshold: v.lowStockThreshold || threshold,
        };
        if (v.stock === 0) outOfStockVariants.push(entry);
        else if (v.stock <= (v.lowStockThreshold || threshold)) lowStockVariants.push(entry);
      }
    }

    return jsonOk({
      products,
      lowStockVariants,
      outOfStockVariants,
      movements,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = stockAdjustmentSchema.parse(body);
    if (!Types.ObjectId.isValid(parsed.productId)) return jsonError("Invalid product ID.", 400);

    await connectDB();
    const session = await mongoose.startSession();
    let result = null;

    try {
      await session.withTransaction(async () => {
        result = await manualAdjustVariantStock({
          productId: parsed.productId,
          sku: parsed.sku,
          delta: parsed.delta,
          note: parsed.note,
          actorId: new Types.ObjectId(staff.id),
          session,
        });
      });
    } finally {
      await session.endSession();
    }

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
