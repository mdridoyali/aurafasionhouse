import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { serializeDoc } from "@/lib/format";
import { ShopCatalogClient } from "@/components/storefront/ShopCatalogClient";
import type { CategoryTileData, ProductCardData } from "@/types/store";

export const metadata: Metadata = {
  title: "Shop All | AURA Fashion House",
  description: "Browse all AURA Fashion House t-shirts, polos, shirts, pants, and accessories.",
};

export const dynamic = "force-dynamic";

export async function queryCatalogProducts(params: {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  inStock?: string;
  newArrival?: string;
  bestSeller?: string;
  flashSale?: string;
  sort?: string;
  page?: string;
}) {
  try {
    await connectDB();

    const filter: Record<string, unknown> = { isDeleted: false, isActive: true };

    if (params.q?.trim()) {
      const q = params.q.trim();
      filter.$or = [
        { name: { $regex: q.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { shortDescription: { $regex: q.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { tags: { $regex: q.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { "variants.sku": { $regex: q.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ];
    }

    if (params.categorySlug) {
      const cat = await Category.findOne({ slug: params.categorySlug.toLowerCase() }).lean();
      if (cat) {
        const subs = await Category.find({ parent: cat._id }).select("_id").lean();
        const ids = [cat._id, ...subs.map((s) => s._id)];
        filter.$and = [{ $or: [{ category: { $in: ids } }, { subcategory: { $in: ids } }] }];
      } else {
        filter._id = new Types.ObjectId(); // no match
      }
    }

    if (params.brandSlug) {
      const brand = await Brand.findOne({ slug: params.brandSlug.toLowerCase() }).lean();
      if (brand) filter.brand = brand._id;
    }

    const minP = Number(params.minPrice);
    const maxP = Number(params.maxPrice);
    if (!Number.isNaN(minP) && minP > 0) {
      filter.basePrice = { ...(filter.basePrice as object), $gte: minP };
    }
    if (!Number.isNaN(maxP) && maxP > 0) {
      filter.basePrice = { ...(filter.basePrice as object), $lte: maxP };
    }

    const minR = Number(params.minRating);
    if (!Number.isNaN(minR) && minR > 0) filter.ratingAvg = { $gte: minR };
    if (params.inStock === "true") filter.totalStock = { $gt: 0 };
    if (params.newArrival === "true") filter.isNewArrival = true;
    if (params.bestSeller === "true") filter.isBestSeller = true;
    if (params.flashSale === "true") filter.isFlashSale = true;

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (params.sort === "price_asc") sort = { basePrice: 1 };
    else if (params.sort === "price_desc") sort = { basePrice: -1 };
    else if (params.sort === "best_selling") sort = { soldCount: -1 };
    else if (params.sort === "rating") sort = { ratingAvg: -1 };

    const page = Math.max(1, Number(params.page) || 1);
    const limit = 12;

    const [products, total, categories, brands, counts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: false, isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const visibleCategories = categories.filter((c) => (countMap.get(c._id.toString()) ?? 0) > 0);

    return {
      products: serializeDoc(products) as unknown as ProductCardData[],
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      categories: serializeDoc(visibleCategories) as unknown as CategoryTileData[],
      brands: serializeDoc(brands) as unknown as Array<{ _id: string; name: string; slug: string }>,
    };
  } catch {
    return {
      products: [],
      total: 0,
      page: 1,
      totalPages: 1,
      categories: [],
      brands: [],
    };
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? sp[k] : undefined);

  const data = await queryCatalogProducts({
    q: pick("q"),
    categorySlug: pick("category"),
    brandSlug: pick("brand"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    minRating: pick("minRating"),
    inStock: pick("inStock"),
    newArrival: pick("newArrival"),
    bestSeller: pick("bestSeller"),
    flashSale: pick("flashSale"),
    sort: pick("sort"),
    page: pick("page"),
  });

  return (
    <div>
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Collections</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Minimal, durable garments tailored for everyday comfort.
          </p>
        </div>
      </div>
      <Suspense fallback={<div className="p-10 text-center text-sm">Loading catalog...</div>}>
        <ShopCatalogClient
          products={data.products}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          categories={data.categories}
          brands={data.brands}
        />
      </Suspense>
    </div>
  );
}
