import React from "react";
import type { Metadata } from "next";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { serializeDoc } from "@/lib/format";
import {
  AccountDashboardClient,
  type AccountOrderSummary,
  type AccountReviewSummary,
} from "@/components/account/AccountDashboardClient";
import type { SavedAddressItem } from "@/components/storefront/CheckoutClient";

export const metadata: Metadata = {
  title: "My Account | AURA Fashion House",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sessionUser = await requireUserPage("/login?next=/account");
  await connectDB();

  const [userDoc, orders, reviews] = await Promise.all([
    User.findById(sessionUser.id).select("name email phone role addresses").lean(),
    Order.find({ userId: new Types.ObjectId(sessionUser.id) })
      .sort({ createdAt: -1 })
      .lean(),
    Review.find({ userId: new Types.ObjectId(sessionUser.id) })
      .populate("productId", "name slug")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return (
    <AccountDashboardClient
      initialProfile={{
        name: userDoc?.name || sessionUser.name,
        email: userDoc?.email || sessionUser.email,
        phone: userDoc?.phone || sessionUser.phone,
        role: sessionUser.role,
      }}
      initialAddresses={serializeDoc(userDoc?.addresses ?? []) as unknown as SavedAddressItem[]}
      orders={serializeDoc(orders) as unknown as AccountOrderSummary[]}
      reviews={serializeDoc(reviews) as unknown as AccountReviewSummary[]}
    />
  );
}
