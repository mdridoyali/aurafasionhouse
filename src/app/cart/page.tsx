"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

export default function CartPage() {
  const { user, cart, cartSubtotal, updateCartQuantity, removeFromCart } = useStore();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Your Shopping Bag</h1>

      {cart.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-300 rounded-2xl space-y-4">
          <ShoppingBag className="w-10 h-10 mx-auto text-neutral-400" />
          <p className="text-neutral-600 font-medium">Your bag is currently empty.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 rounded-full bg-neutral-950 text-white text-sm font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.sku}
                className="flex gap-4 p-4 border border-neutral-200 rounded-xl bg-white"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative w-24 h-28 rounded-lg overflow-hidden bg-neutral-100 shrink-0"
                >
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </Link>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-semibold text-sm sm:text-base hover:text-[#c2410c]"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Color: {item.color} • Size: {item.size} • SKU: {item.sku}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Available stock: {item.stock}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeFromCart(item.sku)}
                      className="p-1.5 text-neutral-400 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="inline-flex items-center border border-neutral-300 rounded-lg">
                      <button
                        type="button"
                        onClick={() => void updateCartQuantity(item.sku, item.quantity - 1)}
                        className="p-1.5 hover:bg-neutral-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => void updateCartQuantity(item.sku, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1.5 hover:bg-neutral-100 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-bold text-sm sm:text-base">
                      {formatBDT(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50 space-y-4 sticky top-24">
              <h2 className="font-bold text-lg">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-semibold">{formatBDT(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery (Bangladesh)</span>
                  <span>৳80 Dhaka / ৳160 Outside</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-base">
                <span>Estimated Subtotal</span>
                <span>{formatBDT(cartSubtotal)}</span>
              </div>

              {user ? (
                <Link
                  href="/checkout"
                  className="w-full py-3 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/login?next=/checkout"
                  className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  Sign In to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <p className="text-[11px] text-neutral-500 text-center">
                Cash on Delivery, bKash, and Nagad accepted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
