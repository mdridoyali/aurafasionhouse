"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Smartphone, Truck, Banknote } from "lucide-react";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import type { StoreSettingsPublic } from "@/types/store";

export interface SavedAddressItem {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  street: string;
  isInsideDhaka: boolean;
  isDefault: boolean;
}

export function CheckoutClient({
  savedAddresses,
  settings,
  userName,
  userPhone,
}: {
  savedAddresses: SavedAddressItem[];
  settings: StoreSettingsPublic;
  userName: string;
  userPhone?: string;
}) {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart, toast } = useStore();

  const defaultAddr =
    savedAddresses.find((a) => a.isDefault) || savedAddresses[0] || null;

  const [fullName, setFullName] = useState(defaultAddr?.fullName || userName);
  const [phone, setPhone] = useState(defaultAddr?.phone || userPhone || "");
  const [division, setDivision] = useState(defaultAddr?.division || "Dhaka");
  const [district, setDistrict] = useState(defaultAddr?.district || "Dhaka");
  const [area, setArea] = useState(defaultAddr?.area || "");
  const [street, setStreet] = useState(defaultAddr?.street || "");
  const [deliveryZone, setDeliveryZone] = useState<"inside_dhaka" | "outside_dhaka">(
    defaultAddr ? (defaultAddr.isInsideDhaka ? "inside_dhaka" : "outside_dhaka") : "inside_dhaka"
  );

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `aura-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const discount = appliedCoupon?.discount ?? 0;
  const deliveryCharge = useMemo(() => {
    const base =
      deliveryZone === "inside_dhaka"
        ? settings.insideDhakaCharge
        : settings.outsideDhakaCharge;
    if (
      settings.freeDeliveryThreshold > 0 &&
      cartSubtotal - discount >= settings.freeDeliveryThreshold
    ) {
      return 0;
    }
    return base;
  }, [cartSubtotal, deliveryZone, discount, settings]);

  const total = Math.max(0, cartSubtotal - discount + deliveryCharge);

  const selectSavedAddress = (addr: SavedAddressItem) => {
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setDivision(addr.division);
    setDistrict(addr.district);
    setArea(addr.area);
    setStreet(addr.street);
    setDeliveryZone(addr.isInsideDhaka ? "inside_dhaka" : "outside_dhaka");
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal: cartSubtotal }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Invalid coupon.", "error");
        return;
      }
      setAppliedCoupon({ code: json.data.code, discount: json.data.discount });
      toast(`Coupon ${json.data.code} applied!`);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          shippingAddress: {
            fullName,
            phone,
            division,
            district,
            area,
            street,
            isInsideDhaka: deliveryZone === "inside_dhaka",
          },
          deliveryZone,
          paymentMethod,
          senderNumber: paymentMethod === "cod" ? undefined : senderNumber,
          transactionId: paymentMethod === "cod" ? undefined : transactionId,
          couponCode: appliedCoupon?.code,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not place order.");
        return;
      }

      await clearCart();
      toast("Order placed successfully!");
      router.push(`/order-success/${json.data.order.orderNumber}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Your Bag is Empty</h1>
        <p className="text-sm text-neutral-500">Add items to your bag before checking out.</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 rounded-full bg-neutral-950 text-white text-sm font-semibold"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handlePlaceOrder} className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Shipping + Delivery + Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Saved Addresses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr._id}
                    type="button"
                    onClick={() => selectSavedAddress(addr)}
                    className="text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-950 bg-white transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs uppercase">{addr.label}</span>
                      <span className="text-[11px] text-neutral-500">
                        {addr.isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka"}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1">{addr.fullName}</p>
                    <p className="text-xs text-neutral-600">{addr.phone}</p>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {addr.street}, {addr.area}, {addr.district}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Form */}
          <div className="border border-neutral-200 rounded-2xl p-6 space-y-4 bg-white">
            <h2 className="font-bold text-lg">Delivery Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number (BD)</label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Division</label>
                <input
                  type="text"
                  required
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">District / City</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Area / Thana</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Banani, Dhanmondi, Mirpur"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Street / House / Flat</label>
                <input
                  type="text"
                  required
                  placeholder="House 12, Road 4, Flat 3B"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
                />
              </div>
            </div>

            {/* Delivery Zone */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                Select Delivery Zone
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("inside_dhaka")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                    deliveryZone === "inside_dhaka"
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white hover:border-neutral-600"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">Inside Dhaka City</p>
                    <p
                      className={`text-xs ${
                        deliveryZone === "inside_dhaka" ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      1-2 business days
                    </p>
                  </div>
                  <span className="font-bold text-sm">
                    {formatBDT(settings.insideDhakaCharge)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone("outside_dhaka")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                    deliveryZone === "outside_dhaka"
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 bg-white hover:border-neutral-600"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">Outside Dhaka</p>
                    <p
                      className={`text-xs ${
                        deliveryZone === "outside_dhaka" ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      2-4 business days nationwide
                    </p>
                  </div>
                  <span className="font-bold text-sm">
                    {formatBDT(settings.outsideDhakaCharge)}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border border-neutral-200 rounded-2xl p-6 space-y-4 bg-white">
            <h2 className="font-bold text-lg">Payment Method</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`p-4 rounded-xl border text-left space-y-1 transition ${
                  paymentMethod === "cod"
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 hover:border-neutral-600"
                }`}
              >
                <Banknote className="w-5 h-5" />
                <p className="font-semibold text-sm">Cash on Delivery</p>
                <p
                  className={`text-[11px] ${
                    paymentMethod === "cod" ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  Pay on arrival
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("bkash")}
                className={`p-4 rounded-xl border text-left space-y-1 transition ${
                  paymentMethod === "bkash"
                    ? "border-[#E2136E] bg-[#E2136E] text-white"
                    : "border-neutral-300 hover:border-[#E2136E]"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <p className="font-semibold text-sm">bKash</p>
                <p
                  className={`text-[11px] ${
                    paymentMethod === "bkash" ? "text-pink-100" : "text-neutral-500"
                  }`}
                >
                  Mobile wallet
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("nagad")}
                className={`p-4 rounded-xl border text-left space-y-1 transition ${
                  paymentMethod === "nagad"
                    ? "border-[#F7941D] bg-[#F7941D] text-white"
                    : "border-neutral-300 hover:border-[#F7941D]"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <p className="font-semibold text-sm">Nagad</p>
                <p
                  className={`text-[11px] ${
                    paymentMethod === "nagad" ? "text-orange-50" : "text-neutral-500"
                  }`}
                >
                  Mobile wallet
                </p>
              </button>
            </div>

            {paymentMethod === "cod" ? (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm text-neutral-700 flex items-start gap-2.5">
                <Truck className="w-4 h-4 mt-0.5 text-[#c2410c] shrink-0" />
                <p>
                  Pay <strong>{formatBDT(total)}</strong> in cash to the delivery rider when your
                  AURA package arrives. Delivery charge is{" "}
                  <strong>{formatBDT(deliveryCharge)}</strong> (
                  {deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}).
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    {paymentMethod === "bkash" ? "bKash" : "Nagad"} Merchant Number:{" "}
                    <span className="text-[#c2410c] font-mono">
                      {paymentMethod === "bkash"
                        ? settings.bkashMerchantNumber
                        : settings.nagadMerchantNumber}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-600">
                    {paymentMethod === "bkash"
                      ? settings.bkashInstructions
                      : settings.nagadInstructions}
                  </p>
                  <p className="text-xs font-semibold text-neutral-900 pt-1">
                    Amount to pay: {formatBDT(total)}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Your {paymentMethod === "bkash" ? "bKash" : "Nagad"} Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Transaction ID (TrxID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BL72K9P1QW"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50 space-y-5 sticky top-24">
            <h2 className="font-bold text-lg">Order Summary ({cart.length} items)</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.sku} className="flex items-center gap-3 text-sm">
                  <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      {item.color} / {item.size} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    {formatBDT(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="pt-2 border-t border-neutral-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo / Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm uppercase"
                />
                <button
                  type="button"
                  disabled={applyingCoupon}
                  onClick={() => void handleApplyCoupon()}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {appliedCoupon.code} applied (-{formatBDT(appliedCoupon.discount)})
                </p>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span>{formatBDT(cartSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span>-{formatBDT(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  Delivery ({deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
                </span>
                <span>{formatBDT(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-neutral-200">
                <span>Total</span>
                <span>{formatBDT(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full py-3.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
            >
              <Lock className="w-4 h-4" />
              {placingOrder ? "Confirming Order..." : `Place Order (${formatBDT(total)})`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
