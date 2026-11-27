import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { StockMovement } from "@/models/StockMovement";
import { productSchema } from "@/lib/validators";
import { computeDiscountPercent, slugify } from "@/lib/format";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const sp = request.nextUrl.searchParams;
    const includeInactive = sp.get("includeInactive") === "true";

    if (includeInactive) {
      const staff = await requireStaffForApi();
      if (!staff) return jsonError("Forbidden", 403);
    }

    const filter: Record<string, unknown> = { isDeleted: false };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const q = sp.get("q")?.trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
        { "variants.sku": { $regex: q, $options: "i" } },
      ];
    }

    const categorySlug = sp.get("category")?.trim();
    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug.toLowerCase() }).select("_id").lean();
      if (cat) {
        const subcats = await Category.find({ parent: cat._id }).select("_id").lean();
        const ids = [cat._id, ...subcats.map((s) => s._id)];
        filter.$and = [
          ...(Array.isArray(filter.$and) ? filter.$and : []),
          { $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] },
        ];
      } else if (Types.ObjectId.isValid(categorySlug)) {
        filter.category = new Types.ObjectId(categorySlug);
      } else {
        return jsonOk({ products: [], total: 0, page: 1, totalPages: 1 });
      }
    }

    const brandSlug = sp.get("brand")?.trim();
    if (brandSlug) {
      const brand = await Brand.findOne({ slug: brandSlug.toLowerCase() }).select("_id").lean();
      if (brand) {
        filter.brand = brand._id;
      }
    }

    const minPrice = Number(sp.get("minPrice"));
    const maxPrice = Number(sp.get("maxPrice"));
    if (!Number.isNaN(minPrice) && minPrice > 0) {
      filter.basePrice = { ...(filter.basePrice as object), $gte: minPrice };
    }
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      filter.basePrice = { ...(filter.basePrice as object), $lte: maxPrice };
    }

    const minRating = Number(sp.get("minRating"));
    if (!Number.isNaN(minRating) && minRating > 0) {
      filter.ratingAvg = { $gte: minRating };
    }

    if (sp.get("inStock") === "true") {
      filter.totalStock = { $gt: 0 };
    }
    if (sp.get("featured") === "true") filter.isFeatured = true;
    if (sp.get("newArrival") === "true") filter.isNewArrival = true;
    if (sp.get("bestSeller") === "true") filter.isBestSeller = true;
    if (sp.get("flashSale") === "true") filter.isFlashSale = true;

    const sortParam = sp.get("sort") || "newest";
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortParam === "price_asc") sort = { basePrice: 1 };
    else if (sortParam === "price_desc") sort = { basePrice: -1 };
    else if (sortParam === "best_selling") sort = { soldCount: -1, createdAt: -1 };
    else if (sortParam === "rating") sort = { ratingAvg: -1, ratingCount: -1 };

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(48, Math.max(1, Number(sp.get("limit")) || 12));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .populate("brand", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return jsonOk({
      products,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
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
    const parsed = productSchema.parse(body);

    await connectDB();

    const slug = slugify(parsed.slug || parsed.name);
    if (!slug) return jsonError("Invalid product slug.", 400);

    const totalStock = parsed.variants.reduce((sum, v) => sum + v.stock, 0);
    const discountPercent = computeDiscountPercent(parsed.basePrice, parsed.compareAtPrice);

    const product = await Product.create({
      ...parsed,
      slug,
      subcategory: parsed.subcategory || null,
      brand: parsed.brand || null,
      discountPercent,
      totalStock,
      isDeleted: false,
    });

    const movements = product.variants
      .filter((v) => v.stock > 0)
      .map((v) => ({
        productId: product._id,
        productName: product.name,
        sku: v.sku,
        size: v.size,
        color: v.color,
        change: v.stock,
        previousStock: 0,
        newStock: v.stock,
        reason: "manual_adjustment" as const,
        note: "Initial product creation",
        performedBy: new Types.ObjectId(staff.id),
      }));

    if (movements.length > 0) {
      await StockMovement.insertMany(movements);
    }

    return jsonOk({ product }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
