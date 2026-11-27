"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProviders";

export default function DashboardSettingsPage() {
  const { toast } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    storeName: "AURA Fashion House",
    tagline: "",
    insideDhakaCharge: 80,
    outsideDhakaCharge: 160,
    freeDeliveryThreshold: 0,
    bkashMerchantNumber: "",
    bkashInstructions: "",
    nagadMerchantNumber: "",
    nagadInstructions: "",
    whatsappNumber: "",
    supportPhone: "",
    supportEmail: "",
    address: "",
    promoStripText: "",
    lowStockAlertThreshold: 5,
  });

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.data.settings) {
          setForm((prev) => ({ ...prev, ...json.data.settings }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/staff/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not save settings.", "error");
        return;
      }
      toast("Store settings updated!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-neutral-500">Loading settings...</p>;

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-sm text-neutral-500">
          Configure Dhaka / Outside Dhaka delivery charges, bKash & Nagad merchant numbers, and
          storefront info.
        </p>
      </div>

      <div className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
          Delivery Charges (BDT ৳)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Inside Dhaka (৳)</label>
            <input
              type="number"
              required
              min={0}
              value={form.insideDhakaCharge}
              onChange={(e) => setForm({ ...form, insideDhakaCharge: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Outside Dhaka (৳)</label>
            <input
              type="number"
              required
              min={0}
              value={form.outsideDhakaCharge}
              onChange={(e) => setForm({ ...form, outsideDhakaCharge: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Free Delivery Over (৳, 0 = off)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeDeliveryThreshold}
              onChange={(e) =>
                setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
          bKash & Nagad Merchant Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">bKash Merchant Number</label>
            <input
              type="text"
              required
              value={form.bkashMerchantNumber}
              onChange={(e) => setForm({ ...form, bkashMerchantNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Nagad Merchant Number</label>
            <input
              type="text"
              required
              value={form.nagadMerchantNumber}
              onChange={(e) => setForm({ ...form, nagadMerchantNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">bKash Instructions</label>
            <textarea
              rows={2}
              value={form.bkashInstructions}
              onChange={(e) => setForm({ ...form, bkashInstructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Nagad Instructions</label>
            <textarea
              rows={2}
              value={form.nagadInstructions}
              onChange={(e) => setForm({ ...form, nagadInstructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
          Brand & Contact Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Store Name</label>
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tagline</label>
            <input
              type="text"
              required
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">WhatsApp Number (880...)</label>
            <input
              type="text"
              required
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Support Phone</label>
            <input
              type="text"
              required
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Support Email</label>
            <input
              type="email"
              required
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Low-Stock Alert Threshold</label>
            <input
              type="number"
              min={1}
              value={form.lowStockAlertThreshold}
              onChange={(e) =>
                setForm({ ...form, lowStockAlertThreshold: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Store Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Top Promo Strip Text</label>
          <input
            type="text"
            required
            value={form.promoStripText}
            onChange={(e) => setForm({ ...form, promoStripText: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 rounded-xl bg-neutral-950 text-white text-sm font-semibold disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Store Settings"}
      </button>
    </form>
  );
}
