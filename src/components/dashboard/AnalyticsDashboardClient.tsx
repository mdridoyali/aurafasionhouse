"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { formatBDT } from "@/lib/format";

interface AnalyticsData {
  summary: {
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingVerifications: number;
    totalRevenue: number;
    paidRevenue: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  dailySales: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{
    _id: string;
    name: string;
    slug: string;
    soldCount: number;
    basePrice: number;
    totalStock: number;
  }>;
}

export function AnalyticsDashboardClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/staff/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
      });
  }, []);

  if (!data) {
    return <div className="py-12 text-sm text-neutral-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Store Overview & Analytics</h1>
        <p className="text-sm text-neutral-500">Real-time sales, order statuses, and verification queue.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p className="text-xs text-neutral-500">Gross Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatBDT(data.summary.totalRevenue)}</p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Paid: {formatBDT(data.summary.paidRevenue)}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p className="text-xs text-neutral-500">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{data.summary.totalOrders}</p>
          <Link
            href="/dashboard/orders?paymentStatus=pending_verification"
            className="text-[11px] text-[#c2410c] font-semibold mt-1 inline-block hover:underline"
          >
            {data.summary.pendingVerifications} pending bKash/Nagad verification →
          </Link>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p className="text-xs text-neutral-500">Customers</p>
          <p className="text-2xl font-bold mt-1">{data.summary.totalCustomers}</p>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
          <p className="text-xs text-neutral-500">Active Products</p>
          <p className="text-2xl font-bold mt-1">{data.summary.totalProducts}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-5 rounded-2xl border border-neutral-200 bg-white">
          <h2 className="font-bold text-sm mb-4">30-Day Sales Revenue (৳)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#c2410c"
                  fill="#fed7aa"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-5 rounded-2xl border border-neutral-200 bg-white">
          <h2 className="font-bold text-sm mb-4">Orders by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="p-5 rounded-2xl border border-neutral-200 bg-white">
        <h2 className="font-bold text-sm mb-4">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Sold</th>
                <th className="py-2">Stock Left</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p) => (
                <tr key={p._id} className="border-b border-neutral-100">
                  <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                  <td className="py-2.5 pr-4">{formatBDT(p.basePrice)}</td>
                  <td className="py-2.5 pr-4 font-semibold">{p.soldCount}</td>
                  <td className="py-2.5">{p.totalStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
