"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductCardData } from "@/types/store";

export function HomeTabsSection({
  bestSellers,
  newArrivals,
  flashSale,
}: {
  bestSellers: ProductCardData[];
  newArrivals: ProductCardData[];
  flashSale: ProductCardData[];
}) {
  const [tab, setTab] = useState<"best" | "new" | "flash">("best");

  const items =
    tab === "best" ? bestSellers : tab === "new" ? newArrivals : flashSale;
  const viewMoreHref =
    tab === "best"
      ? "/shop?bestSeller=true"
      : tab === "new"
        ? "/shop?newArrival=true"
        : "/shop?flashSale=true";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setTab("best")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              tab === "best"
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Best Sellers
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              tab === "new"
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            New Arrivals
          </button>
          <button
            type="button"
            onClick={() => setTab("flash")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              tab === "flash"
                ? "bg-[#c2410c] text-white"
                : "bg-orange-50 text-[#c2410c] hover:bg-orange-100"
            }`}
          >
            Flash Sale
          </button>
        </div>

        <Link
          href={viewMoreHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900 hover:text-[#c2410c]"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-neutral-300 rounded-xl text-sm text-neutral-500">
          No products in this collection yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
