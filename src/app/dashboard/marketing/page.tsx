"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import { CloudinaryUploadButton } from "@/components/dashboard/CloudinaryUploadButton";

interface CouponItem {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  expiresAt: string;
  usedCount: number;
  usageLimit?: number;
  perUserLimit: number;
  isActive: boolean;
}

interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
  placement: "hero" | "promo" | "category_spotlight";
  sortOrder: number;
  isActive: boolean;
}

export default function DashboardMarketingPage() {
  const { toast } = useStore();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(500);
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bBadge, setBBadge] = useState("");
  const [bCtaText, setBCtaText] = useState("Shop Now");
  const [bCtaLink, setBCtaLink] = useState("/shop");
  const [bImageUrl, setBImageUrl] = useState("");

  const loadAll = useCallback(async () => {
    const [cRes, bRes] = await Promise.all([
      fetch("/api/coupons", { cache: "no-store" }),
      fetch("/api/banners?includeInactive=true", { cache: "no-store" }),
    ]);
    const [cJson, bJson] = await Promise.all([cRes.json(), bRes.json()]);
    if (cJson.ok) setCoupons(cJson.data.coupons);
    if (bJson.ok) setBanners(bJson.data.banners);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value, minOrderAmount, expiresAt, perUserLimit: 1, isActive: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not create coupon.", "error");
      return;
    }
    setCode("");
    toast("Coupon created!");
    void loadAll();
  };

  const handleDeleteCoupon = async (id: string) => {
    await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    toast("Coupon deleted", "info");
    void loadAll();
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bTitle,
        subtitle: bSubtitle,
        badge: bBadge,
        ctaText: bCtaText,
        ctaLink: bCtaLink,
        imageUrl: bImageUrl,
        placement: "hero",
        sortOrder: banners.length,
        isActive: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not create banner.", "error");
      return;
    }
    setBTitle("");
    setBSubtitle("");
    setBImageUrl("");
    toast("Banner added!");
    void loadAll();
  };

  const handleDeleteBanner = async (id: string) => {
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    toast("Banner deleted", "info");
    void loadAll();
  };

  return (
    <div className="space-y-12">
      {/* Coupons */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Coupons & Discounts</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 border border-neutral-200 rounded-2xl bg-white divide-y divide-neutral-100">
            {coupons.map((c) => (
              <div key={c._id} className="p-4 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-mono font-bold">
                    {c.code} — {c.type === "percent" ? `${c.value}% OFF` : `৳${c.value} OFF`}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Min order: ৳{c.minOrderAmount} • Expires: {formatDate(c.expiresAt)} • Used:{" "}
                    {c.usedCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteCoupon(c._id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleCreateCoupon}
            className="lg:col-span-5 p-5 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3 h-fit"
          >
            <h2 className="font-bold text-sm">Create Coupon</h2>
            <input
              type="text"
              required
              placeholder="Code (e.g. AURA10)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm uppercase"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (৳)</option>
              </select>
              <input
                type="number"
                required
                min={1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min order ৳"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
              <input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
            >
              Add Coupon
            </button>
          </form>
        </div>
      </section>

      {/* Banners */}
      <section className="space-y-4 pt-8 border-t border-neutral-200">
        <h2 className="text-xl font-bold">Hero Banners</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            {banners.map((b) => (
              <div
                key={b._id}
                className="p-3 border border-neutral-200 rounded-2xl bg-white flex items-center gap-4"
              >
                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                  <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{b.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteBanner(b._id)}
                  className="p-1.5 text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleCreateBanner}
            className="lg:col-span-5 p-5 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3 h-fit"
          >
            <h3 className="font-bold text-sm">Add Hero Banner</h3>
            <input
              type="text"
              required
              placeholder="Headline"
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="text"
              placeholder="Subtitle"
              value={bSubtitle}
              onChange={(e) => setBSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Badge (e.g. New Drop)"
                value={bBadge}
                onChange={(e) => setBBadge(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
              <input
                type="text"
                placeholder="Button Text"
                value={bCtaText}
                onChange={(e) => setBCtaText(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Link (e.g. /shop)"
              value={bCtaLink}
              onChange={(e) => setBCtaLink(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Banner Image URL"
                value={bImageUrl}
                onChange={(e) => setBImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
              <CloudinaryUploadButton
                folder="aura-fashion/banners"
                label="Upload"
                onUploaded={(res) => setBImageUrl(res.url)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
            >
              Add Banner
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
