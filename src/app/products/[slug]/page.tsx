import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { serializeDoc } from "@/lib/format";
import { env } from "@/lib/env";
import {
  ProductDetailClient,
  type ProductDetailData,
  type ReviewItem,
} from "@/components/storefront/ProductDetailClient";
import type { ProductCardData } from "@/types/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB().catch(() => null);
  const product = await Product.findOne({ slug: slug.toLowerCase(), isDeleted: false })
    .lean()
    .catch(() => null);

  if (!product) return { title: "Product Not Found | AURA Fashion House" };
  return {
    title: `${product.name} | AURA Fashion House`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | AURA Fashion House`,
      description: product.shortDescription,
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const product = await Product.findOne({
    slug: slug.toLowerCase(),
    isDeleted: false,
    isActive: true,
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .lean();

  if (!product) notFound();

  const [reviews, related, settings, sessionUser] = await Promise.all([
    Review.find({ productId: product._id, isApproved: true }).sort({ createdAt: -1 }).limit(20).lean(),
    Product.find({
      _id: { $ne: product._id },
      category: product.category._id ?? product.category,
      isDeleted: false,
      isActive: true,
    })
      .populate("category", "name slug")
      .limit(4)
      .lean(),
    getOrCreateStoreSettings(),
    getCurrentUser(),
  ]);

  let canReview = false;
  if (sessionUser) {
    const delivered = await Order.exists({
      userId: new Types.ObjectId(sessionUser.id),
      orderStatus: "delivered",
      "items.productId": product._id,
    });
    canReview = Boolean(delivered);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "AURA Fashion House" },
    offers: {
      "@type": "Offer",
      url: `${env.siteUrl}/products/${product.slug}`,
      priceCurrency: "BDT",
      price: product.basePrice,
      availability:
        product.totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailClient
        product={serializeDoc(product) as unknown as ProductDetailData}
        reviews={serializeDoc(reviews) as unknown as ReviewItem[]}
        related={serializeDoc(related) as unknown as ProductCardData[]}
        canReview={canReview}
        insideDhakaCharge={settings.insideDhakaCharge}
        outsideDhakaCharge={settings.outsideDhakaCharge}
      />
    </>
  );
}
