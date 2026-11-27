"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

interface ReviewRow {
  _id: string;
  productId?: { name: string } | null;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface MessageRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  staffReply?: string;
  createdAt: string;
}

export default function DashboardEngagementPage() {
  const { toast } = useStore();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const loadAll = useCallback(async () => {
    const [rRes, mRes] = await Promise.all([
      fetch("/api/reviews?scope=staff", { cache: "no-store" }),
      fetch("/api/contact", { cache: "no-store" }),
    ]);
    const [rJson, mJson] = await Promise.all([rRes.json(), mRes.json()]);
    if (rJson.ok) setReviews(rJson.data.reviews);
    if (mJson.ok) setMessages(mJson.data.messages);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  const toggleReview = async (id: string, isApproved: boolean) => {
    await fetch(`/api/staff/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    toast(isApproved ? "Review approved" : "Review hidden", "info");
    void loadAll();
  };

  const deleteReview = async (id: string) => {
    await fetch(`/api/staff/reviews/${id}`, { method: "DELETE" });
    toast("Review deleted", "info");
    void loadAll();
  };

  const markMessage = async (id: string, status: "read" | "replied") => {
    await fetch(`/api/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(`Marked as ${status}`, "info");
    void loadAll();
  };

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Customer Reviews Moderation</h1>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-500">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div
                key={r._id}
                className="p-4 border border-neutral-200 rounded-xl bg-white flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <p className="text-sm font-semibold">
                    {r.userName} • {r.rating}★ on{" "}
                    <span className="text-[#c2410c]">{r.productId?.name || "Product"}</span>
                  </p>
                  <p className="text-sm text-neutral-700">{r.comment}</p>
                  <p className="text-xs text-neutral-400">{formatDateTime(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleReview(r._id, !r.isApproved)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium"
                  >
                    {r.isApproved ? "Hide" : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteReview(r._id)}
                    className="p-1.5 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4 pt-8 border-t border-neutral-200">
        <h2 className="text-xl font-bold">Contact Messages</h2>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-500">No contact inquiries yet.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className="p-4 border border-neutral-200 rounded-xl bg-white flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.subject}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-neutral-100">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    From {m.name} ({m.email}
                    {m.phone ? `, ${m.phone}` : ""}) • {formatDateTime(m.createdAt)}
                  </p>
                  <p className="text-sm text-neutral-700 pt-1">{m.message}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void markMessage(m._id, "read")}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs"
                  >
                    Mark Read
                  </button>
                  <button
                    type="button"
                    onClick={() => void markMessage(m._id, "replied")}
                    className="px-3 py-1.5 rounded-lg bg-neutral-950 text-white text-xs"
                  >
                    Mark Replied
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
