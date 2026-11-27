"use client";

import React, { useCallback, useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProviders";

interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "moderator" | "admin";
  isBlocked: boolean;
  createdAt: string;
}

export default function DashboardCustomersPage() {
  const { user: currentUser, toast } = useStore();
  const [users, setUsers] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/staff/users?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setUsers(json.data.users);
  }, [q]);

  useEffect(() => {
    Promise.resolve().then(() => loadUsers());
  }, [loadUsers]);

  const handleToggleBlock = async (target: CustomerRow) => {
    const res = await fetch(`/api/staff/users/${target._id}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !target.isBlocked }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error || "Action not permitted.", "error");
      return;
    }
    toast(target.isBlocked ? "Customer unblocked" : "Customer blocked", "info");
    void loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-neutral-500">
            View registered customers and manage account access.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search name, email, or phone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-neutral-300 text-sm w-64"
        />
      </div>

      <div className="border border-neutral-200 rounded-2xl bg-white overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const canTouch =
                currentUser?.id !== u._id &&
                (currentUser?.role === "admin" || u.role === "user");
              return (
                <tr key={u._id} className="border-b border-neutral-100">
                  <td className="py-3 px-4">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-neutral-500">
                      {u.email}
                      {u.phone ? ` • ${u.phone}` : ""}
                    </p>
                  </td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4 text-xs text-neutral-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canTouch ? (
                      <button
                        type="button"
                        onClick={() => void handleToggleBlock(u)}
                        className="px-3 py-1 rounded-lg border border-neutral-300 text-xs font-medium hover:bg-neutral-50"
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Protected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
