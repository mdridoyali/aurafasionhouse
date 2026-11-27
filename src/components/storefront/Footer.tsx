"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  MessageCircle,
  Home,
  LayoutGrid,
  Heart,
  ShoppingBag,
  User,
} from "lucide-react";
import { useStore } from "@/components/providers/StoreProviders";
import type { StoreSettingsPublic } from "@/types/store";

export function Footer({ settings }: { settings: StoreSettingsPublic }) {
  const { cartCount, wishlistIds, toast } = useStore();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmail("");
        toast("Subscribed to AURA updates!");
      } else {
        toast(json.error || "Could not subscribe.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const waHref = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`;

  return (
    <>
      <footer className="bg-neutral-950 text-neutral-300 pt-14 pb-24 lg:pb-12 mt-16 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-white text-xl font-bold tracking-[0.2em]">AURA</h3>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1">
              Fashion House • Bangladesh
            </p>
            <p className="text-sm text-neutral-400 mt-4 leading-relaxed">
              {settings.tagline}. Crafted for everyday comfort in Bangladesh with reliable
              nationwide delivery.
            </p>
            <p className="text-xs text-neutral-400 mt-4">
              {settings.address}
              <br />
              {settings.supportPhone} • {settings.supportEmail}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/shop" className="hover:text-white">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/shop?newArrival=true" className="hover:text-white">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?bestSeller=true" className="hover:text-white">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/shop?flashSale=true" className="hover:text-white">
                  Flash Sale
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Customer Care</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  About AURA
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white">
                  Shipping Policy (৳{settings.insideDhakaCharge} / ৳{settings.outsideDhakaCharge})
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-white">
                  Return & Size Exchange
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Join Our List</h4>
            <p className="text-sm text-neutral-400 mb-3">
              Early access to new fabric drops and seasonal offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] text-white text-sm font-medium disabled:opacity-60"
              >
                Join
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-neutral-300">
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
                Cash on Delivery
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
                bKash
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800">
                Nagad
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} AURA Fashion House. All rights reserved.</p>
          <p>
            Inside Dhaka: ৳{settings.insideDhakaCharge} • Outside Dhaka: ৳
            {settings.outsideDhakaCharge}
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp & Scroll-to-Top */}
      <div className="fixed right-4 bottom-20 lg:bottom-6 z-30 flex flex-col gap-2.5 no-print">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center transition"
        >
          <MessageCircle className="w-5 h-5" />
        </a>
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-11 h-11 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white shadow-lg flex items-center justify-center transition"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 grid grid-cols-5 h-14 text-[11px] font-medium text-neutral-700 no-print">
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <Link href="/shop" className="flex flex-col items-center justify-center gap-0.5">
          <LayoutGrid className="w-4 h-4" />
          Shop
        </Link>
        <Link href="/wishlist" className="relative flex flex-col items-center justify-center gap-0.5">
          <Heart className="w-4 h-4" />
          Saved
          {wishlistIds.length > 0 && (
            <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-[#c2410c]" />
          )}
        </Link>
        <Link href="/cart" className="relative flex flex-col items-center justify-center gap-0.5">
          <ShoppingBag className="w-4 h-4" />
          Bag ({cartCount})
        </Link>
        <Link href="/account" className="flex flex-col items-center justify-center gap-0.5">
          <User className="w-4 h-4" />
          Account
        </Link>
      </nav>
    </>
  );
}
