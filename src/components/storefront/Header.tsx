"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Truck,
  ChevronDown,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProviders";
import type { CategoryTileData } from "@/types/store";

const POPULAR_SEARCHES = ["Oversized Tee", "Pique Polo", "Oxford Shirt", "Chino Pant"];

export function Header({
  categories,
  promoStripText,
}: {
  categories: CategoryTileData[];
  promoStripText: string;
}) {
  const router = useRouter();
  const { user, cartCount, wishlistIds, logout } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  const rootCategories = categories.filter((c) => !c.parent);
  const subCategoriesOf = (parentId: string) =>
    categories.filter((c) => c.parent === parentId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    setSearchFocused(false);
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200 no-print">
      {/* Top Promo Strip */}
      <div className="bg-neutral-950 text-white text-xs py-2 px-4 text-center tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <span className="truncate">{promoStripText}</span>
          <Link
            href="/track-order"
            className="hidden sm:inline-flex items-center gap-1 underline underline-offset-4 text-amber-300 hover:text-amber-200 shrink-0"
          >
            <Truck className="w-3.5 h-3.5" />
            Track Order
          </Link>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-neutral-800 hover:bg-neutral-100 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-xl sm:text-2xl font-bold tracking-[0.22em] text-neutral-950">
              AURA
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Fashion House
            </span>
          </Link>
        </div>

        {/* Desktop Nav + Mega Menu */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-800">
          <Link href="/shop" className="hover:text-[#c2410c] transition-colors">
            Shop All
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => setMegaOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 py-5 hover:text-[#c2410c] transition-colors"
            >
              Collections
              <ChevronDown className="w-4 h-4" />
            </button>

            {megaOpen && (
              <div className="absolute left-0 top-full w-[520px] bg-white border border-neutral-200 shadow-xl rounded-b-xl p-6 grid grid-cols-2 gap-5">
                {rootCategories.map((cat) => {
                  const subs = subCategoriesOf(cat._id);
                  return (
                    <div key={cat._id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className="font-semibold text-neutral-950 hover:text-[#c2410c] block mb-1.5"
                      >
                        {cat.name}
                      </Link>
                      {subs.length > 0 ? (
                        <ul className="space-y-1 text-xs text-neutral-600">
                          {subs.map((sub) => (
                            <li key={sub._id}>
                              <Link
                                href={`/category/${sub.slug}`}
                                onClick={() => setMegaOpen(false)}
                                className="hover:text-neutral-950"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {cat.description || `Explore ${cat.name}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/shop?newArrival=true" className="hover:text-[#c2410c] transition-colors">
            New Arrivals
          </Link>
          <Link href="/shop?flashSale=true" className="text-[#c2410c] font-semibold">
            Flash Sale
          </Link>
          <Link href="/track-order" className="hover:text-[#c2410c] transition-colors">
            Track Order
          </Link>
        </nav>

        {/* Search Input */}
        <div className="hidden md:block relative flex-1 max-w-xs">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tees, polos, shirts..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 border border-transparent focus:border-neutral-300 focus:bg-white rounded-full outline-none transition"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {searchFocused && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg p-3 z-50">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onMouseDown={() => {
                      setSearchTerm(chip);
                      router.push(`/shop?q=${encodeURIComponent(chip)}`);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-900 hover:text-white transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/wishlist"
            className="relative p-2 text-neutral-800 hover:bg-neutral-100 rounded-full"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#c2410c] text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative p-2 text-neutral-800 hover:bg-neutral-100 rounded-full"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-neutral-950 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group">
              <Link
                href="/account"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-neutral-100 text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
              </Link>
              <div className="hidden group-hover:block absolute right-0 top-full pt-1 w-48 z-50">
                <div className="bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 text-sm">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-50"
                  >
                    <Package className="w-4 h-4" />
                    My Account & Orders
                  </Link>
                  {(user.role === "moderator" || user.role === "admin") && (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-50 text-[#c2410c] font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Staff Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-neutral-50 text-left text-neutral-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-medium hover:bg-neutral-800 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search & Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search AURA products..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 rounded-full outline-none"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg bg-neutral-50 font-medium"
            >
              Shop All
            </Link>
            <Link
              href="/shop?flashSale=true"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg bg-orange-50 text-[#c2410c] font-medium"
            >
              Flash Sale
            </Link>
            {rootCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg bg-neutral-50"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg bg-neutral-50"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
