"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  Tags,
  Boxes,
  ShoppingCart,
  Users,
  ShieldAlert,
  TicketPercent,
  MessageSquare,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/rbac";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Analytics", icon: BarChart3, adminOnly: false },
  { href: "/dashboard/orders", label: "Orders & Payments", icon: ShoppingCart, adminOnly: false },
  { href: "/dashboard/products", label: "Products", icon: Box, adminOnly: false },
  { href: "/dashboard/categories", label: "Categories & Brands", icon: Tags, adminOnly: false },
  { href: "/dashboard/inventory", label: "Inventory & Logs", icon: Boxes, adminOnly: false },
  { href: "/dashboard/marketing", label: "Coupons & Banners", icon: TicketPercent, adminOnly: false },
  { href: "/dashboard/engagement", label: "Reviews & Messages", icon: MessageSquare, adminOnly: false },
  { href: "/dashboard/customers", label: "Customers", icon: Users, adminOnly: false },
  { href: "/dashboard/users", label: "Roles & Access", icon: ShieldAlert, adminOnly: true },
  { href: "/dashboard/settings", label: "Store Settings", icon: Settings, adminOnly: false },
];

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-50/70 p-4">
      <div className="mb-4 px-2">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">Staff Console</p>
        <p className="font-bold text-sm capitalize">{role} Access</p>
      </div>
      <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
        {visibleItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-700 hover:bg-neutral-200/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
