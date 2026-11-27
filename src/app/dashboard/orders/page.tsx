"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatBDT, formatDateTime } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

interface StaffOrder {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryZone: string;
  total: number;
  createdAt: string;
  shippingAddress: { fullName: string; phone: string; area: string; district: string };
  paymentDetails: { senderNumber?: string; transactionId?: string };
  exchangeRequests: Array<{
    _id: string;
    itemSku: string;
    requestedSize: string;
    requestedColor: string;
    reason: string;
    status: string;
  }>;
}

export default function DashboardOrdersPage() {
  const { toast } = useStore();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ scope: "staff" });
    if (statusFilter) params.set("status", statusFilter);
    if (paymentStatusFilter) params.set("paymentStatus", paymentStatusFilter);
    if (q.trim()) params.set("q", q.trim());

    const res = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setOrders(json.data.orders);
    setLoading(false);
  }, [paymentStatusFilter, q, statusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => loadOrders());
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    let returnResellable = false;
    if (nextStatus === "returned") {
      const prompt = await Swal.fire({
        title: "Mark as Returned",
        text: "Are the returned items in resellable condition? (Restores stock once)",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Yes, Resellable (Restore Stock)",
        denyButtonText: "No, Damaged (Do Not Restore)",
      });
      if (prompt.isDismissed) return;
      returnResellable = prompt.isConfirmed;
    }

    const res = await fetch(`/api/staff/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, returnResellable }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Could not update status.", "error");
      return;
    }
    toast(`Order updated to ${nextStatus}`);
    void loadOrders();
  };

  const handlePaymentVerify = async (orderId: string, decision: "paid" | "rejected") => {
    const confirm = await Swal.fire({
      title: decision === "paid" ? "Verify & Approve Payment?" : "Reject Payment & Cancel Order?",
      text:
        decision === "rejected"
          ? "Rejecting payment cancels this order and restores stock."
          : "Order will be marked as Paid and Confirmed.",
      input: decision === "rejected" ? "text" : undefined,
      inputPlaceholder: "Reason for rejection (e.g. TrxID not found)",
      icon: decision === "paid" ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: decision === "paid" ? "#0a0a0a" : "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/api/staff/orders/${orderId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: confirm.value }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Payment update failed.", "error");
      return;
    }
    toast(decision === "paid" ? "Payment verified!" : "Payment rejected & stock restored.", "info");
    void loadOrders();
  };

  const handleExchangeDecision = async (
    orderId: string,
    exchangeId: string,
    decision: "approved" | "rejected"
  ) => {
    const res = await fetch(`/api/staff/orders/${orderId}/exchange/${exchangeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Exchange action failed.", "error");
      return;
    }
    toast(`Exchange ${decision}`);
    void loadOrders();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders & Payment Verification</h1>
          <p className="text-sm text-neutral-500">
            Verify bKash/Nagad TrxIDs, update fulfillment statuses, and resolve size exchanges.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Order #, phone, name, or TrxID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-neutral-300 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white"
        >
          <option value="">All Order Statuses</option>
          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid (COD)</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders matched the filters.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="p-5 border border-neutral-200 rounded-2xl bg-white space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-base">{o.orderNumber}</span>
                    <Link
                      href={`/account/orders/${o._id}`}
                      className="text-xs text-[#c2410c] hover:underline inline-flex items-center gap-1"
                    >
                      Invoice <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDateTime(o.createdAt)} • {o.shippingAddress.fullName} (
                    {o.shippingAddress.phone}) • {o.shippingAddress.area},{" "}
                    {o.shippingAddress.district}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-base">{formatBDT(o.total)}</span>
                  <select
                    value={o.orderStatus}
                    disabled={o.orderStatus === "cancelled"}
                    onChange={(e) => void handleStatusChange(o._id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold uppercase bg-neutral-50"
                  >
                    {[
                      "pending",
                      "confirmed",
                      "processing",
                      "shipped",
                      "delivered",
                      "cancelled",
                      "returned",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold uppercase">{o.paymentMethod}</span> •{" "}
                  <span className="capitalize">{o.paymentStatus.replace("_", " ")}</span>
                  {o.paymentDetails?.senderNumber && (
                    <span className="ml-3">
                      Sender: <strong>{o.paymentDetails.senderNumber}</strong>
                    </span>
                  )}
                  {o.paymentDetails?.transactionId && (
                    <span className="ml-3 font-mono">
                      TrxID: <strong>{o.paymentDetails.transactionId}</strong>
                    </span>
                  )}
                </div>

                {o.paymentStatus === "pending_verification" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handlePaymentVerify(o._id, "paid")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePaymentVerify(o._id, "rejected")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Exchange Requests */}
              {o.exchangeRequests?.filter((ex) => ex.status === "pending").length > 0 && (
                <div className="space-y-2">
                  {o.exchangeRequests
                    .filter((ex) => ex.status === "pending")
                    .map((ex) => (
                      <div
                        key={ex._id}
                        className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold">
                            Size Exchange Request: {ex.itemSku} → {ex.requestedColor} /{" "}
                            {ex.requestedSize}
                          </p>
                          <p className="text-neutral-600">{ex.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleExchangeDecision(o._id, ex._id, "approved")}
                            className="px-3 py-1.5 rounded bg-neutral-950 text-white font-semibold"
                          >
                            Approve & Swap Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExchangeDecision(o._id, ex._id, "rejected")}
                            className="px-3 py-1.5 rounded bg-white border border-neutral-300 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
