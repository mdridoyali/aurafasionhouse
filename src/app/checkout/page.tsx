import React from "react";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/session";
import { User } from "@/models/User";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { serializeDoc } from "@/lib/format";
import { CheckoutClient, type SavedAddressItem } from "@/components/storefront/CheckoutClient";
import type { StoreSettingsPublic } from "@/types/store";

export const metadata: Metadata = {
  title: "Checkout | AURA Fashion House",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const sessionUser = await requireUserPage("/login?next=/checkout");
  await connectDB();

  const [userDoc, settings] = await Promise.all([
    User.findById(sessionUser.id).select("addresses name phone").lean(),
    getOrCreateStoreSettings(),
  ]);

  return (
    <CheckoutClient
      savedAddresses={serializeDoc(userDoc?.addresses ?? []) as unknown as SavedAddressItem[]}
      settings={serializeDoc(settings) as unknown as StoreSettingsPublic}
      userName={userDoc?.name || sessionUser.name}
      userPhone={userDoc?.phone || sessionUser.phone}
    />
  );
}
