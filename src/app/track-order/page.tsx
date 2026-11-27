"use client";

import React, { useState } from "react";
import { Truck, CheckCircle2, Clock } from "lucide-react";
import { formatBDT, formatDateTime } from "@/lib/format";

interface TrackedOrder {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryZone: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  createdAt: string;
  shippingAddress: { area: string; district: string };
  statusHistory: Array<{ status: string; note?: string; changedAt: string }>;
  items: Array<{
    name: string;
    size: string;
    color: string;
    quantity: number;
    lineTotal: number;
  }>;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Order not found.");
        return;
      }
      setOrder(json.data.order);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <Truck className="w-10 h-10 mx-auto text-[#c2410c]" />
        <h1 className="text-2xl sm:text-3xl font-bold mt-3">Track Your AURA Order</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Enter your order number and the phone number used during checkout.
        </p>
      </div>

      <form
        onSubmit={handleTrack}
        className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <input
          type="text"
          required
          placeholder="Order No (e.g. AUR-20261126-A1B2)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm uppercase"
        />
        <input
          type="tel"
          required
          placeholder="Phone (e.g. 017XXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Checking..." : "Track Order"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 border border-neutral-200 rounded-2xl p-6 space-y-6 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <p className="text-xs text-neutral-500">Order Number</p>
              <p className="text-lg font-bold">{order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-neutral-950 text-white">
                {order.orderStatus}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-neutral-100 text-neutral-800">
                {order.paymentMethod.toUpperCase()} • {order.paymentStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Status Timeline</h2>
            <div className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  {i === order.statusHistory.length - 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#c2410c] mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{h.status}</p>
                    {h.note && <p className="text-xs text-neutral-500">{h.note}</p>}
                    <p className="text-[11px] text-neutral-400">{formatDateTime(h.changedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Destination</span>
              <span>
                {order.shippingAddress.area}, {order.shippingAddress.district}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Delivery Charge</span>
              <span>{formatBDT(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-100">
              <span>Total</span>
              <span>{formatBDT(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
