"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { CategoryTileData, ProductCardData } from "@/types/store";

interface BrandItem {
  _id: string;
  name: string;
  slug: string;
}

export function ShopCatalogClient({
  products,
  total,
  page,
  totalPages,
  categories,
  brands,
  basePath = "/shop",
  lockedCategorySlug,
}: {
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
  categories: CategoryTileData[];
  brands: BrandItem[];
  basePath?: string;
  lockedCategorySlug?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [q, setQ] = useState(sp.get("q") || "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") || "");

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in updates)) {
      next.delete("page");
    }
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const activeCategory = lockedCategorySlug || sp.get("category") || "";
  const activeBrand = sp.get("brand") || "";
  const activeSort = sp.get("sort") || "newest";
  const inStock = sp.get("inStock") === "true";
  const minRating = sp.get("minRating") || "";

  const clearAll = () => {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    router.push(basePath);
  };

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      {!lockedCategorySlug && (
        <div>
          <h3 className="font-semibold text-neutral-950 mb-2.5">Category</h3>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => updateParams({ category: null })}
              className={`block w-full text-left px-2.5 py-1.5 rounded-lg ${
                !activeCategory ? "bg-neutral-950 text-white font-medium" : "hover:bg-neutral-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => updateParams({ category: c.slug })}
                className={`block w-full text-left px-2.5 py-1.5 rounded-lg ${
                  activeCategory === c.slug
                    ? "bg-neutral-950 text-white font-medium"
                    : "hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-neutral-950 mb-2.5">Brand</h3>
          <select
            value={activeBrand}
            onChange={(e) => updateParams({ brand: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-neutral-950 mb-2.5">Price Range (৳)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-sm"
          />
          <span className="text-neutral-400">-</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            updateParams({
              minPrice: minPrice || null,
              maxPrice: maxPrice || null,
            })
          }
          className="mt-2 w-full py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
        >
          Apply Price
        </button>
      </div>

      <div>
        <h3 className="font-semibold text-neutral-950 mb-2.5">Minimum Rating</h3>
        <select
          value={minRating}
          onChange={(e) => updateParams({ minRating: e.target.value || null })}
          className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
        >
          <option value="">Any Rating</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => updateParams({ inStock: e.target.checked ? "true" : null })}
          className="rounded border-neutral-300"
        />
        <span>In Stock Only</span>
      </label>

      <button
        type="button"
        onClick={clearAll}
        className="text-xs underline text-neutral-600 hover:text-neutral-950"
      >
        Reset all filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-sm text-neutral-500">
            Showing <span className="font-semibold text-neutral-950">{products.length}</span> of{" "}
            <span className="font-semibold text-neutral-950">{total}</span> items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: q.trim() || null });
            }}
            className="flex gap-1.5"
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products or SKU..."
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white w-48 sm:w-60"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-neutral-950 text-white text-xs font-medium"
            >
              Search
            </button>
          </form>

          <select
            value={activeSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            aria-label="Sort products"
            className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="best_selling">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {filtersOpen && (
        <div className="lg:hidden mt-4 p-4 border border-neutral-200 rounded-xl bg-neutral-50">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Filters</span>
            <button type="button" onClick={() => setFiltersOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          {FilterPanel}
        </div>
      )}

      <div className="mt-8 flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">{FilterPanel}</aside>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-neutral-300 rounded-xl">
              <p className="text-neutral-700 font-medium">No products matched your filters.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 px-4 py-2 rounded-full bg-neutral-950 text-white text-xs font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateParams({ page: String(p) })}
                  className={`w-9 h-9 rounded-lg text-sm font-medium border ${
                    p === page
                      ? "bg-neutral-950 text-white border-neutral-950"
                      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
