import type { Metadata } from "next";
import "./globals.css";
import { StoreProviders } from "@/components/providers/StoreProviders";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { serializeDoc } from "@/lib/format";
import { env } from "@/lib/env";
import type { CategoryTileData, ClientUser, StoreSettingsPublic } from "@/types/store";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "AURA Fashion House | Minimal Everyday Apparel in Bangladesh",
    template: "%s | AURA Fashion House",
  },
  description:
    "Shop premium T-shirts, polos, shirts, pants, and accessories from AURA Fashion House Bangladesh. Cash on Delivery, bKash & Nagad accepted nationwide.",
  openGraph: {
    type: "website",
    siteName: "AURA Fashion House",
    title: "AURA Fashion House | Minimal Everyday Apparel",
    description:
      "Premium menswear and everyday essentials crafted in Bangladesh. Inside Dhaka ৳80, Outside Dhaka ৳160.",
  },
};

const FALLBACK_SETTINGS: StoreSettingsPublic = {
  storeName: "AURA Fashion House",
  tagline: "Minimal Everyday Menswear & Essentials",
  insideDhakaCharge: 80,
  outsideDhakaCharge: 160,
  freeDeliveryThreshold: 0,
  bkashMerchantNumber: "01700-000000",
  bkashInstructions:
    "Send Money or Payment to our bKash merchant number and enter your sender number & TrxID.",
  nagadMerchantNumber: "01800-000000",
  nagadInstructions:
    "Send Money or Payment to our Nagad merchant number and enter your sender number & TrxID.",
  whatsappNumber: "8801700000000",
  supportPhone: "+880 1700-000000",
  supportEmail: "care@aurafashion.com.bd",
  address: "House 24, Road 11, Banani, Dhaka 1213, Bangladesh",
  promoStripText:
    "Inside Dhaka ৳80 • Outside Dhaka ৳160 • 7-Day Easy Size Exchange • bKash, Nagad & COD",
};

async function getLayoutShellData(): Promise<{
  user: ClientUser | null;
  categories: CategoryTileData[];
  settings: StoreSettingsPublic;
}> {
  try {
    const [sessionUser] = await Promise.all([getCurrentUser(), connectDB()]);
    const [rawCategories, counts, settingsDoc] = await Promise.all([
      Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Product.aggregate<{ _id: string; count: number }>([
        { $match: { isDeleted: false, isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      getOrCreateStoreSettings(),
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const visibleCategories = rawCategories
      .map((c) => ({
        ...c,
        productCount: countMap.get(c._id.toString()) ?? 0,
      }))
      .filter((c) => c.productCount > 0 || Boolean(c.parent));

    return {
      user: sessionUser
        ? {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            phone: sessionUser.phone,
            photoURL: sessionUser.photoURL,
            emailVerified: sessionUser.emailVerified,
            role: sessionUser.role,
          }
        : null,
      categories: serializeDoc(visibleCategories) as unknown as CategoryTileData[],
      settings: serializeDoc(settingsDoc) as unknown as StoreSettingsPublic,
    };
  } catch {
    return { user: null, categories: [], settings: FALLBACK_SETTINGS };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, categories, settings } = await getLayoutShellData();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-neutral-950 font-sans antialiased">
        <StoreProviders initialUser={user}>
          <Header categories={categories} promoStripText={settings.promoStripText} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </StoreProviders>
      </body>
    </html>
  );
}
