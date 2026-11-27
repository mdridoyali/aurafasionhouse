import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { queryCatalogProducts } from "@/app/shop/page";
import { ShopCatalogClient } from "@/components/storefront/ShopCatalogClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await connectDB().catch(() => null);
  const category = await Category.findOne({ slug: slug.toLowerCase(), isActive: true })
    .lean()
    .catch(() => null);

  if (!category) return { title: "Category | AURA Fashion House" };
  return {
    title: `${category.name} | AURA Fashion House`,
    description: category.description || `Shop ${category.name} at AURA Fashion House Bangladesh.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? sp[k] : undefined);

  await connectDB();
  const category = await Category.findOne({ slug: slug.toLowerCase(), isActive: true }).lean();
  if (!category) notFound();

  const data = await queryCatalogProducts({
    q: pick("q"),
    categorySlug: slug,
    brandSlug: pick("brand"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    minRating: pick("minRating"),
    inStock: pick("inStock"),
    sort: pick("sort"),
    page: pick("page"),
  });

  return (
    <div>
      <div className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-xs uppercase tracking-widest text-neutral-500">AURA Collection</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-neutral-600 mt-1 max-w-2xl">{category.description}</p>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="p-10 text-center text-sm">Loading collection...</div>}>
        <ShopCatalogClient
          products={data.products}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          categories={data.categories}
          brands={data.brands}
          basePath={`/category/${slug}`}
          lockedCategorySlug={slug}
        />
      </Suspense>
    </div>
  );
}
