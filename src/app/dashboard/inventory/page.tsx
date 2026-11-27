"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, PackageX } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

interface InventoryResponse {
  products: Array<{
    _id: string;
    name: string;
    variants: Array<{ sku: string; size: string; color: string; stock: number }>;
  }>;
  lowStockVariants: Array<{
    productName: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
  }>;
  outOfStockVariants: Array<{
    productName: string;
    sku: string;
    size: string;
    color: string;
  }>;
  movements: Array<{
    _id: string;
    productName: string;
    sku: string;
    change: number;
    previousStock: number;
    newStock: number;
    reason: string;
    note?: string;
    orderNumber?: string;
    createdAt: string;
  }>;
}

export default function DashboardInventoryPage() {
  const { toast } = useStore();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [delta, setDelta] = useState(10);
  const [note, setNote] = useState("Restock shipment received");

  const loadData = useCallback(async () => {
    const res = await fetch("/api/staff/inventory", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setData(json.data);
      const first = json.data.products[0];
      if (!selectedProductId && first) {
        setSelectedProductId(first._id);
        setSelectedSku(first.variants[0]?.sku || "");
      }
    }
  }, [selectedProductId]);

  useEffect(() => {
    Promise.resolve().then(() => loadData());
  }, [loadData]);

  const activeProduct = data?.products.find((p) => p._id === selectedProductId);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/staff/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProductId,
        sku: selectedSku,
        delta: Number(delta),
        note,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Adjustment failed.", "error");
      return;
    }
    toast("Stock adjusted!");
    void loadData();
  };

  if (!data) return <p className="text-sm text-neutral-500">Loading inventory...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Inventory & Stock Log</h1>
        <p className="text-sm text-neutral-500">
          Monitor low-stock alerts, adjust variant stock, and inspect every atomic movement.
        </p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-red-200 bg-red-50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <PackageX className="w-4 h-4" />
            Out of Stock ({data.outOfStockVariants.length})
          </div>
          {data.outOfStockVariants.length === 0 ? (
            <p className="text-xs text-red-700">No out-of-stock SKUs.</p>
          ) : (
            <ul className="text-xs text-red-800 space-y-1 max-h-36 overflow-y-auto">
              {data.outOfStockVariants.map((v) => (
                <li key={v.sku}>
                  <strong>{v.sku}</strong> — {v.productName} ({v.color} / {v.size})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            Low Stock Alerts ({data.lowStockVariants.length})
          </div>
          {data.lowStockVariants.length === 0 ? (
            <p className="text-xs text-amber-700">All remaining SKUs are well stocked.</p>
          ) : (
            <ul className="text-xs text-amber-900 space-y-1 max-h-36 overflow-y-auto">
              {data.lowStockVariants.map((v) => (
                <li key={v.sku}>
                  <strong>{v.sku}</strong> — {v.productName} ({v.color} / {v.size}):{" "}
                  <strong>{v.stock} left</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Manual Adjustment */}
      <form
        onSubmit={handleAdjust}
        className="p-6 border border-neutral-200 rounded-2xl bg-neutral-50 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium mb-1">Product</label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              const p = data.products.find((item) => item._id === e.target.value);
              setSelectedProductId(e.target.value);
              setSelectedSku(p?.variants[0]?.sku || "");
            }}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          >
            {data.products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Variant SKU</label>
          <select
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          >
            {activeProduct?.variants.map((v) => (
              <option key={v.sku} value={v.sku}>
                {v.sku} ({v.size}/{v.color}: {v.stock})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Change (+/-)</label>
          <input
            type="number"
            required
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Reason / Note</label>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
        >
          Adjust Stock
        </button>
      </form>

      {/* Audit Log */}
      <div className="border border-neutral-200 rounded-2xl bg-white overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Product / SKU</th>
              <th className="py-3 px-4">Change</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Note / Order</th>
            </tr>
          </thead>
          <tbody>
            {data.movements.map((m) => (
              <tr key={m._id} className="border-b border-neutral-100">
                <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap">
                  {formatDateTime(m.createdAt)}
                </td>
                <td className="py-2.5 px-4">
                  <p className="font-medium">{m.productName}</p>
                  <p className="text-[11px] font-mono text-neutral-500">{m.sku}</p>
                </td>
                <td
                  className={`py-2.5 px-4 font-bold ${
                    m.change > 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {m.change > 0 ? `+${m.change}` : m.change}
                </td>
                <td className="py-2.5 px-4">
                  {m.previousStock} → <strong>{m.newStock}</strong>
                </td>
                <td className="py-2.5 px-4 capitalize">{m.reason.replace(/_/g, " ")}</td>
                <td className="py-2.5 px-4 text-neutral-600">
                  {m.orderNumber ? `${m.orderNumber} — ` : ""}
                  {m.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
