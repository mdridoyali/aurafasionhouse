import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Truck, ShieldCheck, RefreshCw, Smartphone } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { serializeDoc } from "@/lib/format";
import { HeroSlider, type BannerSlide } from "@/components/storefront/HeroSlider";
import { HomeTabsSection } from "@/components/storefront/HomeTabsSection";
import { ProductCarouselSection } from "@/components/storefront/ProductCarouselSection";
import type { CategoryTileData, ProductCardData } from "@/types/store";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    await connectDB();
    const [banners, rawCategories, counts, allActiveProducts, settings] = await Promise.all([
      Banner.find({ isActive: true, placement: "hero" }).sort({ sortOrder: 1 }).lean(),
      Category.find({ isActive: true, parent: null }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: false, isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Product.find({ isDeleted: false, isActive: true })
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      getOrCreateStoreSettings(),
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const visibleCategories = rawCategories
      .map((c) => ({ ...c, productCount: countMap.get(c._id.toString()) ?? 0 }))
      .filter((c) => c.productCount > 0);

    return {
      banners: serializeDoc(banners) as unknown as BannerSlide[],
      categories: serializeDoc(visibleCategories) as unknown as CategoryTileData[],
      products: serializeDoc(allActiveProducts) as unknown as ProductCardData[],
      insideDhakaCharge: settings.insideDhakaCharge,
      outsideDhakaCharge: settings.outsideDhakaCharge,
    };
  } catch {
    return {
      banners: [],
      categories: [],
      products: [],
      insideDhakaCharge: 80,
      outsideDhakaCharge: 160,
    };
  }
}

export default async function HomePage() {
  const { banners, categories, products, insideDhakaCharge, outsideDhakaCharge } =
    await getHomeData();

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 8);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 8);
  const flashSale = products.filter((p) => p.isFlashSale || p.discountPercent > 0).slice(0, 8);

  const fallbackBest = bestSellers.length > 0 ? bestSellers : products.slice(0, 8);
  const fallbackNew = newArrivals.length > 0 ? newArrivals : products.slice(0, 8);

  // Category spotlights (up to 3 root categories with products)
  const categorySpotlights = categories.slice(0, 3).map((cat) => ({
    category: cat,
    items: products.filter((p) => p.category?.slug === cat.slug).slice(0, 4),
  }));

  return (
    <div>
      <HeroSlider banners={banners} />

      {/* Trust & Delivery Strip */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-[#c2410c] shrink-0" />
            <div>
              <p className="font-semibold text-neutral-950">Nationwide Delivery</p>
              <p className="text-neutral-500 text-xs">
                Inside Dhaka ৳{insideDhakaCharge} • Outside ৳{outsideDhakaCharge}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-[#c2410c] shrink-0" />
            <div>
              <p className="font-semibold text-neutral-950">Flexible Payment</p>
              <p className="text-neutral-500 text-xs">Cash on Delivery, bKash & Nagad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#c2410c] shrink-0" />
            <div>
              <p className="font-semibold text-neutral-950">Easy Size Exchange</p>
              <p className="text-neutral-500 text-xs">7-day hassle-free exchange</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#c2410c] shrink-0" />
            <div>
              <p className="font-semibold text-neutral-950">Combed Cotton Quality</p>
              <p className="text-neutral-500 text-xs">Pre-shrunk & bio-washed fabrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Tiles */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                Shop by Category
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Curated essentials designed for the Dhaka wardrobe.
              </p>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-neutral-900 hover:text-[#c2410c]"
            >
              Browse All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200"
              >
                <Image
                  src={cat.image || "/images/placeholder-garment.svg"}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="font-semibold text-sm sm:text-base">{cat.name}</p>
                  <p className="text-[11px] text-neutral-200">{cat.productCount} items</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers / New Arrivals / Flash Sale Tabs */}
      <HomeTabsSection
        bestSellers={fallbackBest}
        newArrivals={fallbackNew}
        flashSale={flashSale}
      />

      {/* Category Spotlights */}
      {categorySpotlights.map((spot) => (
        <ProductCarouselSection
          key={spot.category._id}
          title={spot.category.name}
          subtitle={spot.category.description}
          viewAllHref={`/category/${spot.category.slug}`}
          products={spot.items}
        />
      ))}
    </div>
  );
}
