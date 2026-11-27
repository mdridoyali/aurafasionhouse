"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { formatBDT, formatDate } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import { ProductCard } from "./ProductCard";
import type { ProductCardData } from "@/types/store";

export interface ProductDetailData extends ProductCardData {
  description: string;
  brand?: { _id: string; name: string; slug: string } | null;
  careInstructions: string[];
  sizeGuide: Array<{
    size: string;
    chest: string;
    length: string;
    shoulder?: string;
    waist?: string;
  }>;
  tags: string[];
}

export interface ReviewItem {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export function ProductDetailClient({
  product,
  reviews: initialReviews,
  related,
  canReview,
  insideDhakaCharge,
  outsideDhakaCharge,
}: {
  product: ProductDetailData;
  reviews: ReviewItem[];
  related: ProductCardData[];
  canReview: boolean;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
}) {
  const router = useRouter();
  const { addToCart, wishlistIds, toggleWishlist, toast } = useStore();
  const isWishlisted = wishlistIds.includes(product._id);

  const uniqueColors = useMemo(() => {
    const map = new Map<string, { color: string; hex: string }>();
    for (const v of product.variants) {
      if (!map.has(v.color)) map.set(v.color, { color: v.color, hex: v.colorHex });
    }
    return Array.from(map.values());
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState(
    uniqueColors[0]?.color || product.variants[0]?.color || ""
  );

  const colorVariants = useMemo(
    () => product.variants.filter((v) => v.color === selectedColor),
    [product.variants, selectedColor]
  );

  const [selectedSize, setSelectedSize] = useState(
    colorVariants.find((v) => v.stock > 0)?.size || colorVariants[0]?.size || ""
  );

  const activeVariant =
    colorVariants.find((v) => v.size === selectedSize) ||
    colorVariants[0] ||
    product.variants[0];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const activeImages = product.images.length
    ? product.images
    : [{ url: "/images/placeholder-garment.svg", alt: product.name, sortOrder: 0 }];

  const currentImageUrl =
    activeImages[activeImageIndex]?.url ||
    activeImages[0]?.url ||
    "/images/placeholder-garment.svg";

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const nextVars = product.variants.filter((v) => v.color === color);
    if (!nextVars.some((v) => v.size === selectedSize)) {
      setSelectedSize(nextVars.find((v) => v.stock > 0)?.size || nextVars[0]?.size || "");
    }
    const colorImgIdx = activeImages.findIndex(
      (img) => img.color && img.color.toLowerCase() === color.toLowerCase()
    );
    if (colorImgIdx >= 0) setActiveImageIndex(colorImgIdx);
    setQuantity(1);
  };

  const stock = activeVariant?.stock ?? 0;
  const price = activeVariant?.price ?? product.basePrice;
  const compareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = Boolean(compareAt && compareAt > price);

  const handleAddToCart = async (buyNow = false) => {
    if (!activeVariant || stock < 1) {
      toast("Selected size/color is out of stock.", "error");
      return;
    }
    const ok = await addToCart({
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
      quantity: Math.min(quantity, activeVariant.stock),
      image: currentImageUrl,
    });
    if (ok && buyNow) {
      router.push("/checkout");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not submit review.", "error");
        return;
      }
      setReviews((prev) => [json.data.review, ...prev.filter((r) => r._id !== json.data.review._id)]);
      setReviewTitle("");
      setReviewComment("");
      toast("Thank you for your review!");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-neutral-950">
          Home
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-neutral-950">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-neutral-900 font-medium truncate">{product.name}</span>
      </nav>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200">
            <Image
              src={currentImageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>

          {activeImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2.5">
              {activeImages.map((img, idx) => (
                <button
                  key={`${img.url}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition ${
                    idx === activeImageIndex ? "border-neutral-950" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Purchase Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                {product.brand?.name || "AURA Fashion House"}
              </span>
              {product.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mt-2">
              {product.name}
            </h1>
            <p className="text-sm text-neutral-600 mt-2">{product.shortDescription}</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-950">
                {formatBDT(price)}
              </span>
              {hasDiscount && compareAt && (
                <>
                  <span className="text-base text-neutral-400 line-through">
                    {formatBDT(compareAt)}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-[#c2410c]">
                    Save {Math.round(((compareAt - price) / compareAt) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-900">
                Color: <span className="font-normal text-neutral-600">{selectedColor}</span>
              </span>
              {activeVariant && (
                <span className="text-neutral-500">SKU: {activeVariant.sku}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {uniqueColors.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => handleSelectColor(c.color)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    selectedColor === c.color
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/40"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-900">
                Size: <span className="font-normal text-neutral-600">{selectedSize}</span>
              </span>
              {product.sizeGuide.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1 text-[#c2410c] font-medium hover:underline"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size Guide
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {colorVariants.map((v) => (
                <button
                  key={v.sku}
                  type="button"
                  disabled={v.stock === 0}
                  onClick={() => {
                    setSelectedSize(v.size);
                    setQuantity(1);
                  }}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition ${
                    selectedSize === v.size
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : v.stock === 0
                        ? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed bg-neutral-50"
                        : "border-neutral-300 hover:border-neutral-950"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>

            <div className="mt-2 text-xs">
              {stock === 0 ? (
                <span className="text-red-600 font-medium">Out of stock in this variant</span>
              ) : stock <= 5 ? (
                <span className="text-[#c2410c] font-semibold">
                  Only {stock} left in stock — order soon!
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">In Stock ({stock} available)</span>
              )}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-neutral-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-neutral-100"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, stock), q + 1))}
                  className="p-3 hover:bg-neutral-100"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={stock === 0}
                onClick={() => void handleAddToCart(false)}
                className="flex-1 py-3 px-5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>

              <button
                type="button"
                onClick={() => void toggleWishlist(product._id)}
                aria-label="Toggle wishlist"
                className="p-3 rounded-lg border border-neutral-300 hover:border-neutral-950"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "fill-[#c2410c] text-[#c2410c]" : "text-neutral-800"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              disabled={stock === 0}
              onClick={() => void handleAddToCart(true)}
              className="w-full py-3 px-5 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition"
            >
              <Zap className="w-4 h-4" />
              Buy Now — Express Checkout
            </button>
          </div>

          {/* Delivery & Fabric Specs */}
          <div className="border-t border-neutral-200 pt-5 space-y-3 text-xs sm:text-sm text-neutral-700">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[#c2410c] mt-0.5 shrink-0" />
              <p>
                <strong>Delivery across Bangladesh:</strong> Inside Dhaka {formatBDT(insideDhakaCharge)},
                Outside Dhaka {formatBDT(outsideDhakaCharge)}. Pay via Cash on Delivery, bKash, or Nagad.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#c2410c] mt-0.5 shrink-0" />
              <p>
                <strong>Fabric & GSM:</strong> {product.fabric}
                {product.gsm ? ` (${product.gsm} GSM)` : ""}.
              </p>
            </div>
          </div>

          {/* Description & Care */}
          <div className="border-t border-neutral-200 pt-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950 mb-1.5">Product Details</h2>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
            {product.careInstructions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-950 mb-1.5">Care Instructions</h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-neutral-600 space-y-1">
                  {product.careInstructions.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="mt-16 pt-10 border-t border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <h2 className="text-xl font-bold text-neutral-950">Customer Reviews</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {product.ratingCount > 0
                ? `Rated ${product.ratingAvg.toFixed(1)} out of 5 based on ${product.ratingCount} verified reviews.`
                : "No reviews yet."}
            </p>

            {canReview ? (
              <form
                onSubmit={handleReviewSubmit}
                className="mt-6 p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3"
              >
                <h3 className="font-semibold text-sm">Write a Verified Review</h3>
                <div>
                  <label className="block text-xs font-medium mb-1">Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                  >
                    <option value={5}>5 Stars — Excellent</option>
                    <option value={4}>4 Stars — Very Good</option>
                    <option value={3}>3 Stars — Good</option>
                    <option value={2}>2 Stars — Fair</option>
                    <option value={1}>1 Star — Poor</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Headline (optional)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Share your thoughts on fit, fabric, and comfort..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-lg bg-neutral-950 text-white text-sm font-medium disabled:opacity-60"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-xs text-neutral-500">
                Only customers who have received a delivered order for this item can submit a review.
              </p>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-300 rounded-xl text-sm text-neutral-500">
                Be the first verified buyer to review this garment.
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r._id} className="p-5 border border-neutral-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{r.userName}</span>
                    <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                  {r.title && <p className="font-medium text-sm pt-1">{r.title}</p>}
                  <p className="text-sm text-neutral-600">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-950 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">AURA Size Guide (Inches)</h3>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Chest / Waist</th>
                    <th className="py-2 pr-3">Length</th>
                    <th className="py-2">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {product.sizeGuide.map((row, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="py-2 pr-3 font-semibold">{row.size}</td>
                      <td className="py-2 pr-3">{row.chest || row.waist}</td>
                      <td className="py-2 pr-3">{row.length}</td>
                      <td className="py-2">{row.shoulder || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
