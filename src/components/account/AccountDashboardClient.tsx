"use client";

import React, { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { MapPin, Package, Trash2, User as UserIcon, Heart, Star } from "lucide-react";
import { formatBDT, formatDate } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";
import type { SavedAddressItem } from "@/components/storefront/CheckoutClient";

export interface AccountOrderSummary {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
}

export interface AccountReviewSummary {
  _id: string;
  productId?: { name: string; slug: string } | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export function AccountDashboardClient({
  initialProfile,
  initialAddresses,
  orders,
  reviews,
}: {
  initialProfile: { name: string; email: string; phone?: string; role: string };
  initialAddresses: SavedAddressItem[];
  orders: AccountOrderSummary[];
  reviews: AccountReviewSummary[];
}) {
  const { toast } = useStore();
  const [tab, setTab] = useState<"overview" | "orders" | "addresses" | "reviews" | "profile">(
    "overview"
  );

  const [name, setName] = useState(initialProfile.name);
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddressItem[]>(initialAddresses);
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    fullName: initialProfile.name,
    phone: initialProfile.phone || "",
    division: "Dhaka",
    district: "Dhaka",
    area: "",
    street: "",
    isInsideDhaka: true,
    isDefault: false,
  });
  const [addingAddr, setAddingAddr] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Failed to update profile.", "error");
        return;
      }
      toast("Profile updated!");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddr(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Could not save address.", "error");
        return;
      }
      setAddresses(json.data.addresses);
      setNewAddr({ ...newAddr, area: "", street: "" });
      toast("Address saved!");
    } finally {
      setAddingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Remove this address?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0a0a0a",
      confirmButtonText: "Remove",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setAddresses(json.data.addresses);
      toast("Address removed", "info");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Signed in as {initialProfile.email}
          </p>
        </div>
        {(initialProfile.role === "admin" || initialProfile.role === "moderator") && (
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-[#c2410c] text-white text-xs font-semibold self-start"
          >
            Open Staff Dashboard
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 border-b border-neutral-200 mb-8 text-sm">
        {[
          { id: "overview", label: "Overview" },
          { id: "orders", label: `Orders (${orders.length})` },
          { id: "addresses", label: `Addresses (${addresses.length})` },
          { id: "reviews", label: `Reviews (${reviews.length})` },
          { id: "profile", label: "Profile" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
              tab === t.id
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/wishlist"
          className="px-4 py-2 rounded-full font-medium whitespace-nowrap bg-neutral-100 text-neutral-700 hover:bg-neutral-200 inline-flex items-center gap-1.5"
        >
          <Heart className="w-3.5 h-3.5" />
          Wishlist
        </Link>
      </div>

      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50">
              <Package className="w-5 h-5 text-[#c2410c]" />
              <p className="text-2xl font-bold mt-2">{orders.length}</p>
              <p className="text-xs text-neutral-500">Total Orders</p>
            </div>
            <div className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50">
              <MapPin className="w-5 h-5 text-[#c2410c]" />
              <p className="text-2xl font-bold mt-2">{addresses.length}</p>
              <p className="text-xs text-neutral-500">Saved Addresses</p>
            </div>
            <div className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50">
              <UserIcon className="w-5 h-5 text-[#c2410c]" />
              <p className="text-lg font-bold mt-2 truncate">{name}</p>
              <p className="text-xs text-neutral-500">{phone || "Add phone in profile"}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-neutral-500">You have not placed any orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <Link
                    key={o._id}
                    href={`/account/orders/${o._id}`}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 border border-neutral-200 rounded-xl hover:border-neutral-950 transition"
                  >
                    <div>
                      <p className="font-mono font-bold text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(o.createdAt)} • {o.items.length} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-neutral-100">
                        {o.orderStatus}
                      </span>
                      <span className="font-bold text-sm">{formatBDT(o.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders found.</p>
          ) : (
            orders.map((o) => (
              <Link
                key={o._id}
                href={`/account/orders/${o._id}`}
                className="flex flex-wrap items-center justify-between gap-4 p-5 border border-neutral-200 rounded-xl hover:border-neutral-950 transition bg-white"
              >
                <div>
                  <p className="font-mono font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Placed {formatDate(o.createdAt)} • {o.paymentMethod.toUpperCase()} (
                    {o.paymentStatus.replace("_", " ")})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-neutral-950 text-white">
                    {o.orderStatus}
                  </span>
                  <span className="font-bold">{formatBDT(o.total)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-3">
            {addresses.length === 0 ? (
              <p className="text-sm text-neutral-500">No saved addresses yet.</p>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="p-4 border border-neutral-200 rounded-xl flex items-start justify-between gap-3 bg-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-neutral-950 text-white">
                          Default
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">
                        {addr.isInsideDhaka ? "Inside Dhaka" : "Outside Dhaka"}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {addr.fullName} • {addr.phone}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {addr.street}, {addr.area}, {addr.district}, {addr.division}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAddress(addr._id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="lg:col-span-5 p-6 border border-neutral-200 rounded-2xl bg-neutral-50 space-y-3 h-fit"
          >
            <h3 className="font-bold">Add New Address</h3>
            <input
              type="text"
              required
              placeholder="Label (Home, Office)"
              value={newAddr.label}
              onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              placeholder="Recipient Full Name"
              value={newAddr.fullName}
              onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="tel"
              required
              placeholder="Phone (017XXXXXXXX)"
              value={newAddr.phone}
              onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Division"
                value={newAddr.division}
                onChange={(e) => setNewAddr({ ...newAddr, division: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
              <input
                type="text"
                required
                placeholder="District"
                value={newAddr.district}
                onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
              />
            </div>
            <input
              type="text"
              required
              placeholder="Area / Thana"
              value={newAddr.area}
              onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              placeholder="House / Road / Flat"
              value={newAddr.street}
              onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={newAddr.isInsideDhaka}
                onChange={(e) => setNewAddr({ ...newAddr, isInsideDhaka: e.target.checked })}
              />
              Inside Dhaka City (৳80 delivery)
            </label>
            <button
              type="submit"
              disabled={addingAddr}
              className="w-full py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
            >
              {addingAddr ? "Saving..." : "Save Address"}
            </button>
          </form>
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-500">You have not written any product reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="p-4 border border-neutral-200 rounded-xl bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={r.productId ? `/products/${r.productId.slug}` : "/shop"}
                    className="font-semibold text-sm hover:text-[#c2410c]"
                  >
                    {r.productId?.name || "AURA Product"}
                  </Link>
                  <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: r.rating }, (_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-neutral-600">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-md p-6 border border-neutral-200 rounded-2xl bg-white space-y-4"
        >
          <h2 className="font-bold text-lg">Profile Settings</h2>
          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="017XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 rounded-lg bg-neutral-950 text-white text-sm font-semibold"
          >
            {savingProfile ? "Saving..." : "Update Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
