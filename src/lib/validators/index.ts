import { z } from "zod";

export const bdPhoneRegex = /^01[3-9]\d{8}$/;

export function normalizeBdPhone(val: string): string {
  return val.replace(/[\s-]/g, "").replace(/^\+?88/, "");
}

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone: z
    .string()
    .trim()
    .transform(normalizeBdPhone)
    .refine((v) => bdPhoneRegex.test(v), "Enter a valid 11-digit BD phone number (01XXXXXXXXX)"),
  division: z.string().trim().min(2, "Division is required").max(50),
  district: z.string().trim().min(2, "District is required").max(50),
  area: z.string().trim().min(2, "Area / Thana is required").max(80),
  street: z.string().trim().min(4, "Full street / house address is required").max(200),
  isInsideDhaka: z.boolean(),
  isDefault: z.boolean().optional().default(false),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizeBdPhone(v) : undefined))
    .refine((v) => !v || bdPhoneRegex.test(v), "Invalid BD phone number"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  image: z.string().trim().optional(),
  imagePublicId: z.string().trim().optional(),
  parent: z.string().trim().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const brandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  logo: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const productVariantSchema = z.object({
  sku: z.string().trim().min(2).max(60).transform((v) => v.toUpperCase()),
  size: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(40),
  colorHex: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").default("#111111"),
  price: z.coerce.number().min(1),
  compareAtPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  image: z.string().trim().optional(),
});

export const productImageSchema = z.object({
  url: z.string().trim().min(1),
  publicId: z.string().trim().optional(),
  alt: z.string().trim().optional(),
  color: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const sizeGuideRowSchema = z.object({
  size: z.string().trim().min(1),
  chest: z.string().trim().min(1),
  length: z.string().trim().min(1),
  shoulder: z.string().trim().optional(),
  waist: z.string().trim().optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(2).max(180).optional(),
  shortDescription: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().nullable().optional(),
  brand: z.string().trim().nullable().optional(),
  basePrice: z.coerce.number().min(1),
  compareAtPrice: z.coerce.number().min(0).optional(),
  fabric: z.string().trim().min(2).max(120).default("100% Combed Cotton"),
  gsm: z.coerce.number().int().min(50).max(600).optional(),
  careInstructions: z.array(z.string().trim().min(1)).default([]),
  sizeGuide: z.array(sizeGuideRowSchema).default([]),
  images: z.array(productImageSchema).min(1, "At least one product image is required"),
  variants: z.array(productVariantSchema).min(1, "At least one size/color variant is required"),
  tags: z.array(z.string().trim().min(1)).default([]),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const cartItemInputSchema = z.object({
  productId: z.string().trim().min(1),
  sku: z.string().trim().min(1).transform((v) => v.toUpperCase()),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const cartMergeSchema = z.object({
  items: z.array(cartItemInputSchema).max(50),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(100),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z
      .string()
      .trim()
      .transform(normalizeBdPhone)
      .refine((v) => bdPhoneRegex.test(v), "Enter a valid 11-digit BD phone number"),
    division: z.string().trim().min(2).max(50),
    district: z.string().trim().min(2).max(50),
    area: z.string().trim().min(2).max(80),
    street: z.string().trim().min(4).max(200),
    isInsideDhaka: z.boolean(),
  }),
  deliveryZone: z.enum(["inside_dhaka", "outside_dhaka"]),
  paymentMethod: z.enum(["cod", "bkash", "nagad"]),
  senderNumber: z.string().trim().optional(),
  transactionId: z.string().trim().optional(),
  couponCode: z.string().trim().optional(),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(30).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(200).optional(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(1),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  expiresAt: z.string().trim().min(1),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(260).optional(),
  badge: z.string().trim().max(40).optional(),
  ctaText: z.string().trim().max(40).optional(),
  ctaLink: z.string().trim().max(240).optional(),
  imageUrl: z.string().trim().min(1),
  imagePublicId: z.string().trim().optional(),
  mobileImageUrl: z.string().trim().optional(),
  placement: z.enum(["hero", "promo", "category_spotlight"]).default("hero"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const reviewSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(5).max(1000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(2000),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(160),
  insideDhakaCharge: z.coerce.number().min(0).max(2000),
  outsideDhakaCharge: z.coerce.number().min(0).max(2000),
  freeDeliveryThreshold: z.coerce.number().min(0).max(100000),
  bkashMerchantNumber: z.string().trim().min(6).max(30),
  bkashInstructions: z.string().trim().min(5).max(400),
  nagadMerchantNumber: z.string().trim().min(6).max(30),
  nagadInstructions: z.string().trim().min(5).max(400),
  whatsappNumber: z.string().trim().min(6).max(20),
  supportPhone: z.string().trim().min(6).max(30),
  supportEmail: z.string().trim().email(),
  address: z.string().trim().min(5).max(240),
  promoStripText: z.string().trim().min(5).max(240),
  lowStockAlertThreshold: z.coerce.number().int().min(1).max(100),
});

export const roleChangeSchema = z.object({
  role: z.enum(["user", "moderator", "admin"]),
  reason: z.string().trim().max(300).optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  delta: z.coerce.number().int().refine((v) => v !== 0, "Delta cannot be zero"),
  note: z.string().trim().min(3).max(300),
});

export const exchangeRequestSchema = z.object({
  itemSku: z.string().trim().min(1),
  requestedSize: z.string().trim().min(1),
  requestedColor: z.string().trim().min(1),
  reason: z.string().trim().min(5).max(300),
});
