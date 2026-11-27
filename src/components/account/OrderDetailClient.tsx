"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import { Printer, XCircle, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { formatBDT, formatDateTime } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

export interface OrderDetailData {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryZone: string;
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharge: number;
  total: number;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    street: string;
  };
  paymentDetails: {
    provider: string;
    senderNumber?: string;
    transactionId?: string;
    rejectionReason?: string;
  };
  statusHistory: Array<{ status: string; note?: string; changedAt: string }>;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    slug: string;
    size: string;
    color: string;
    image: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  exchangeRequests: Array<{
    _id: string;
    itemSku: string;
    requestedSize: string;
    requestedColor: string;
    status: string;
    reason: string;
    staffNote?: string;
    createdAt: string;
  }>;
}

export function OrderDetailClient({ initialOrder }: { initialOrder: OrderDetailData }) {
  const { toast } = useStore();
  const [order, setOrder] = useState<OrderDetailData>(initialOrder);
  const [cancelling, setCancelling] = useState(false);

  const [exchangeSku, setExchangeSku] = useState(initialOrder.items?.[0]?.sku || "");
  const [requestedSize, setRequestedSize] = useState("L");
  const [requestedColor, setRequestedColor] = useState(initialOrder.items?.[0]?.color || "");
  const [exchangeReason, setExchangeReason] = useState("");
  const [submittingExchange, setSubmittingExchange] = useState(false);

  const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

  const handleCancelOrder = async () => {
    const resConfirm = await Swal.fire({
      title: "Cancel this order?",
      text: "Your reserved items will be returned to store inventory.",
      input: "text",
      inputLabel: "Reason (optional)",
      inputPlaceholder: "Changed my mind / ordered wrong size",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c2410c",
      confirmButtonText: "Yes, cancel order",
    });

    if (!resConfirm.isConfirmed) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: resConfirm.value || "Cancelled by customer" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not cancel order.", "error");
        return;
      }
      setOrder(json.data.order);
      toast("Order cancelled and stock restored.", "info");
    } finally {
      setCancelling(false);
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExchange(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSku: exchangeSku,
          requestedSize,
          requestedColor,
          reason: exchangeReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not submit exchange request.", "error");
        return;
      }
      setOrder(json.data.order);
      setExchangeReason("");
      toast("Size exchange request submitted!");
    } finally {
      setSubmittingExchange(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link href="/account" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">
          ← Back to My Account
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold hover:bg-neutral-50"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
          {canCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancelOrder()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Card */}
      <div className="border border-neutral-200 rounded-2xl p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xl font-bold tracking-[0.2em]">AURA</p>
            <p className="text-xs text-neutral-500">AURA Fashion House • Bangladesh</p>
            <p className="text-xs text-neutral-500 mt-1">Order Invoice</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
            <p className="text-xs text-neutral-500">{formatDateTime(order.createdAt)}</p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-neutral-950 text-white">
              {order.orderStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">Ship To</p>
            <p className="font-semibold">{order.shippingAddress?.fullName ?? "—"}</p>
            <p>{order.shippingAddress?.phone ?? "—"}</p>
            <p className="text-neutral-600">
              {order.shippingAddress?.street ?? "—"}, {order.shippingAddress?.area ?? "—"},{" "}
              {order.shippingAddress?.district ?? "—"}, {order.shippingAddress?.division ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500 mb-1">Payment</p>
            <p className="font-semibold">{order.paymentDetails?.provider}</p>
            <p className="capitalize text-neutral-600">
              Status: {typeof order.paymentStatus === "string" ? order.paymentStatus.replaceAll("_", " ") : "Unknown"}
            </p>
            {order.paymentDetails?.senderNumber && (
              <p className="text-xs text-neutral-600">Sender: {order.paymentDetails?.senderNumber}</p>
            )}
            {order.paymentDetails?.transactionId && (
              <p className="text-xs font-mono text-neutral-700">
                TrxID: {order.paymentDetails?.transactionId}
              </p>
            )}
            {order.paymentDetails?.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">
                Note: {order.paymentDetails?.rejectionReason}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="border-t border-neutral-200 pt-4 space-y-3">
          {(order.items ?? []).map((item) => (
            <div key={item.sku} className="flex items-center gap-3 text-sm">
              <div className="relative w-12 h-14 rounded bg-neutral-100 overflow-hidden shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="font-semibold hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-neutral-500">
                  {item.color} / {item.size} • SKU: {item.sku} • {formatBDT(item.unitPrice)} ×{" "}
                  {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatBDT(item.lineTotal)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-200 pt-4 space-y-1.5 text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatBDT(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
              <span>-{formatBDT(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">
              Delivery ({order.deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"})
            </span>
            <span>{formatBDT(order.deliveryCharge)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200">
            <span>Total</span>
            <span>{formatBDT(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="border border-neutral-200 rounded-2xl p-6 bg-white space-y-4 no-print">
        <h2 className="font-bold text-base">Order Timeline</h2>
        <div className="space-y-3">
          {(order.statusHistory ?? []).map((h, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              {i === (order.statusHistory ?? []).length - 1 ? (
                <CheckCircle2 className="w-4 h-4 text-[#c2410c] mt-0.5 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-semibold capitalize">{h.status}</p>
                {h.note && <p className="text-xs text-neutral-600">{h.note}</p>}
                <p className="text-[11px] text-neutral-400">{formatDateTime(h.changedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wrong-Size Exchange Request (Delivered orders only) */}
      {order.orderStatus === "delivered" && (
        <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-50 space-y-4 no-print">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#c2410c]" />
            <h2 className="font-bold text-base">Request Wrong-Size Exchange</h2>
          </div>

          {(order.exchangeRequests ?? []).length > 0 && (
            <div className="space-y-2">
              {(order.exchangeRequests ?? []).map((ex) => (
                <div key={ex._id} className="p-3 rounded-lg bg-white border border-neutral-200 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>
                      {ex.itemSku} → {ex.requestedColor} / {ex.requestedSize}
                    </span>
                    <span className="uppercase">{ex.status}</span>
                  </div>
                  <p className="text-neutral-600 mt-1">{ex.reason}</p>
                  {ex.staffNote && <p className="text-neutral-500 mt-1">Staff note: {ex.staffNote}</p>}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleExchangeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={exchangeSku}
              onChange={(e) => setExchangeSku(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            >
              {(order.items ?? []).map((i) => (
                <option key={i.sku} value={i.sku}>
                  {i.name} ({i.size})
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Requested Size (e.g. L, XL)"
              value={requestedSize}
              onChange={(e) => setRequestedSize(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              placeholder="Requested Color"
              value={requestedColor}
              onChange={(e) => setRequestedColor(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              placeholder="Reason (e.g. Chest is slightly tight)"
              value={exchangeReason}
              onChange={(e) => setExchangeReason(e.target.value)}
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <button
              type="submit"
              disabled={submittingExchange}
              className="px-4 py-2 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
            >
              {submittingExchange ? "Submitting..." : "Request Exchange"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
