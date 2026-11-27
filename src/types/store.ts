import type { UserRole } from "@/lib/auth/rbac";

export interface ClientUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  emailVerified: boolean;
  role: UserRole;
}

export interface ClientCartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  quantity: number;
  image: string;
}

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  basePrice: number;
  compareAtPrice?: number;
  discountPercent: number;
  fabric: string;
  gsm?: number;
  totalStock: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  category?: { _id: string; name: string; slug: string } | null;
  images: Array<{ url: string; alt?: string; color?: string; sortOrder: number }>;
  variants: Array<{
    _id?: string;
    sku: string;
    size: string;
    color: string;
    colorHex: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    lowStockThreshold?: number;
    image?: string;
  }>;
}

export interface CategoryTileData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | null;
  productCount?: number;
}

export interface StoreSettingsPublic {
  storeName: string;
  tagline: string;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryThreshold: number;
  bkashMerchantNumber: string;
  bkashInstructions: string;
  nagadMerchantNumber: string;
  nagadInstructions: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  promoStripText: string;
}
