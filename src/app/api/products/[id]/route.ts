import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { productSchema } from "@/lib/validators";
import { computeDiscountPercent, slugify } from "@/lib/format";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const query = Types.ObjectId.isValid(id)
      ? { _id: id, isDeleted: false }
      : { slug: id.toLowerCase(), isDeleted: false };

    const product = await Product.findOne(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("brand", "name slug")
      .lean();

    if (!product) {
      return jsonError("Product not found.", 404);
    }

    const [reviews, related] = await Promise.all([
      Review.find({ productId: product._id, isApproved: true }).sort({ createdAt: -1 }).limit(20).lean(),
      Product.find({
        _id: { $ne: product._id },
        category: product.category._id ?? product.category,
        isDeleted: false,
        isActive: true,
      })
        .limit(4)
        .lean(),
    ]);

    return jsonOk({ product, reviews, related });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid product ID.", 400);

    const body = await request.json();
    const parsed = productSchema.parse(body);

    await connectDB();
    const existing = await Product.findOne({ _id: id, isDeleted: false });
    if (!existing) return jsonError("Product not found.", 404);

    const slug = slugify(parsed.slug || parsed.name);
    const totalStock = parsed.variants.reduce((sum, v) => sum + v.stock, 0);
    const discountPercent = computeDiscountPercent(parsed.basePrice, parsed.compareAtPrice);

    existing.name = parsed.name;
    existing.slug = slug;
    existing.shortDescription = parsed.shortDescription;
    existing.description = parsed.description;
    existing.category = new Types.ObjectId(parsed.category);
    existing.subcategory = parsed.subcategory ? new Types.ObjectId(parsed.subcategory) : null;
    existing.brand = parsed.brand ? new Types.ObjectId(parsed.brand) : null;
    existing.basePrice = parsed.basePrice;
    existing.compareAtPrice = parsed.compareAtPrice;
    existing.discountPercent = discountPercent;
    existing.fabric = parsed.fabric;
    existing.gsm = parsed.gsm;
    existing.careInstructions = parsed.careInstructions;
    existing.sizeGuide = parsed.sizeGuide;
    existing.images = parsed.images;
    existing.variants = parsed.variants as never;
    existing.totalStock = totalStock;
    existing.tags = parsed.tags;
    existing.isFeatured = parsed.isFeatured;
    existing.isNewArrival = parsed.isNewArrival;
    existing.isBestSeller = parsed.isBestSeller;
    existing.isFlashSale = parsed.isFlashSale;
    existing.isActive = parsed.isActive;

    await existing.save();
    return jsonOk({ product: existing });
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
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid product ID.", 400);

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return jsonError("Product not found.", 404);

    const referencedInOrder = await Order.exists({ "items.productId": product._id });
    if (referencedInOrder) {
      product.isDeleted = true;
      product.isActive = false;
      await product.save();
      return jsonOk({ softDeleted: true });
    }

    for (const img of product.images) {
      if (img.publicId) {
        await deleteCloudinaryAsset(img.publicId);
      }
    }
    await Product.deleteOne({ _id: product._id });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
