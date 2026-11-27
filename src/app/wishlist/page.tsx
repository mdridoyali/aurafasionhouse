"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/StoreProviders";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductCardData } from "@/types/store";

export default function WishlistPage() {
  const { user, wishlistIds } = useStore();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    let active = true;
    if (!user) return;
    fetch("/api/account/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json.ok) {
          setProducts(json.data.wishlist || []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, wishlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved Wishlist</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pieces you saved from AURA Fashion House.
          </p>
        </div>
        <Link href="/shop" className="text-sm font-semibold underline">
          Continue Shopping
        </Link>
      </div>

      {!user ? (
        <div className="p-12 text-center border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3">
          <Heart className="w-8 h-8 mx-auto text-neutral-400" />
          <p className="font-semibold">Sign in to view your saved wishlist</p>
          <Link
            href="/login?next=/wishlist"
            className="inline-block px-5 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[3/4] rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-neutral-300 rounded-2xl space-y-3">
          <p className="text-neutral-600">Your wishlist is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block px-5 py-2.5 rounded-full bg-neutral-950 text-white text-sm font-medium"
          >
            Explore Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
