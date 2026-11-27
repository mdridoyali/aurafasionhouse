"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import type { ProductCardData } from "@/types/store";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { wishlistIds, toggleWishlist, addToCart } = useStore();
  const isWishlisted = wishlistIds.includes(product._id);

  const uniqueColors = useMemo(() => {
    const map = new Map<string, { color: string; hex: string }>();
    for (const v of product.variants) {
      if (!map.has(v.color)) {
        map.set(v.color, { color: v.color, hex: v.colorHex || "#111111" });
      }
    }
    return Array.from(map.values());
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState<string>(
    uniqueColors[0]?.color || product.variants[0]?.color || ""
  );

  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color === selectedColor),
    [product.variants, selectedColor]
  );

  const [selectedSize, setSelectedSize] = useState<string>(
    colorVariants.find((v) => v.stock > 0)?.size || colorVariants[0]?.size || ""
  );

  const activeVariant =
    colorVariants.find((v) => v.size === selectedSize) ||
    colorVariants[0] ||
    product.variants[0];

  const primaryImg = useMemo(() => {
    const match = product.images.find(
      (img) => img.color && img.color.toLowerCase() === selectedColor.toLowerCase()
    );
    return (
      activeVariant?.image ||
      match?.url ||
      product.images[0]?.url ||
      "/images/placeholder-garment.svg"
    );
  }, [activeVariant?.image, product.images, selectedColor]);

  const secondaryImg = useMemo(() => {
    const other = product.images.find((img) => img.url !== primaryImg);
    return other?.url || primaryImg;
  }, [primaryImg, product.images]);

  const [hovered, setHovered] = useState(false);

  const displayPrice = activeVariant?.price ?? product.basePrice;
  const displayCompare = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = Boolean(displayCompare && displayCompare > displayPrice);
  const discountPct = hasDiscount
    ? Math.round((((displayCompare ?? 0) - displayPrice) / (displayCompare ?? 1)) * 100)
    : product.discountPercent;

  const isOutOfStock = product.totalStock <= 0;
  const activeStock = activeVariant?.stock ?? 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeVariant || activeVariant.stock < 1) return;
    await addToCart({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      sku: activeVariant.sku,
      size: activeVariant.size,
      color: activeVariant.color,
      colorHex: activeVariant.colorHex,
      price: activeVariant.price,
      compareAtPrice: activeVariant.compareAtPrice,
      stock: activeVariant.stock,
      quantity: 1,
      image: primaryImg,
    });
  };

  return (
    <div
      className="group flex flex-col bg-white border border-neutral-200/80 rounded-xl overflow-hidden hover:border-neutral-400 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={hovered ? secondaryImg : primaryImg}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          {discountPct > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#c2410c] text-white rounded">
              -{discountPct}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-neutral-950 text-white rounded">
              New
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-neutral-700 text-white rounded">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            void toggleWishlist(product._id);
          }}
          aria-label="Save to wishlist"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition"
        >
          <Heart
            className={`w-4 h-4 ${
              isWishlisted ? "fill-[#c2410c] text-[#c2410c]" : "text-neutral-700"
            }`}
          />
        </button>

        {/* Quick Add Overlay */}
        {!isOutOfStock && activeVariant && activeVariant.stock > 0 && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="hidden sm:flex items-center justify-center gap-1.5 absolute inset-x-2.5 bottom-2.5 py-2 rounded-lg bg-neutral-950/90 hover:bg-neutral-950 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Quick Add ({activeVariant.size})
          </button>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-neutral-500">
            <span className="truncate">{product.category?.name || "AURA"}</span>
            {product.ratingCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-neutral-700 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {product.ratingAvg.toFixed(1)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="mt-1 block text-sm font-semibold text-neutral-950 line-clamp-1 hover:text-[#c2410c] transition-colors"
          >
            {product.name}
          </Link>

          <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
            {product.fabric}
            {product.gsm ? ` • ${product.gsm} GSM` : ""}
          </p>
        </div>

        {/* Color swatches + Size pills */}
        <div className="space-y-2">
          {uniqueColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {uniqueColors.slice(0, 5).map((c) => (
                <button
                  key={c.color}
                  type="button"
                  title={c.color}
                  onClick={() => {
                    setSelectedColor(c.color);
                    const nextVars = product.variants.filter((v) => v.color === c.color);
                    if (!nextVars.some((v) => v.size === selectedSize)) {
                      setSelectedSize(nextVars[0]?.size || "");
                    }
                  }}
                  className={`w-4 h-4 rounded-full border transition ${
                    selectedColor === c.color
                      ? "ring-2 ring-neutral-950 ring-offset-1 border-white"
                      : "border-neutral-300"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}

          {colorVariants.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {colorVariants.slice(0, 5).map((v) => (
                <button
                  key={v.sku}
                  type="button"
                  disabled={v.stock === 0}
                  onClick={() => setSelectedSize(v.size)}
                  className={`px-1.5 py-0.5 text-[10px] rounded border transition ${
                    selectedSize === v.size
                      ? "bg-neutral-950 text-white border-neutral-950"
                      : v.stock === 0
                        ? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold text-neutral-950">
              {formatBDT(displayPrice)}
            </span>
            {hasDiscount && displayCompare && (
              <span className="text-xs text-neutral-400 line-through">
                {formatBDT(displayCompare)}
              </span>
            )}
          </div>
          {activeStock > 0 && activeStock <= 5 && (
            <span className="text-[10px] font-medium text-[#c2410c]">
              Only {activeStock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
