import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const staticRoutes = [
    "",
    "/shop",
    "/track-order",
    "/about",
    "/contact",
    "/faq",
    "/shipping-policy",
    "/return-policy",
    "/privacy-policy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  try {
    await connectDB();
    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
      Product.find({ isDeleted: false, isActive: true }).select("slug updatedAt").lean(),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c) => ({
        url: `${base}/category/${c.slug}`,
        lastModified: c.updatedAt || new Date(),
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt || new Date(),
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
