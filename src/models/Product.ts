import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  color?: string;
  sortOrder: number;
}

export interface IProductVariant {
  _id: Types.ObjectId;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  image?: string;
}

export interface ISizeGuideRow {
  size: string;
  chest: string;
  length: string;
  shoulder?: string;
  waist?: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId | null;
  brand?: Types.ObjectId | null;
  basePrice: number;
  compareAtPrice?: number;
  discountPercent: number;
  fabric: string;
  gsm?: number;
  careInstructions: string[];
  sizeGuide: ISizeGuideRow[];
  images: IProductImage[];
  variants: IProductVariant[];
  totalStock: number;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true },
    color: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    colorHex: { type: String, required: true, trim: true, default: "#111111" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    image: { type: String, trim: true },
  },
  { _id: true }
);

const SizeGuideRowSchema = new Schema<ISizeGuideRow>(
  {
    size: { type: String, required: true, trim: true },
    chest: { type: String, required: true, trim: true },
    length: { type: String, required: true, trim: true },
    shoulder: { type: String, trim: true },
    waist: { type: String, trim: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", default: null, index: true },
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 95 },
    fabric: { type: String, required: true, trim: true, default: "100% Combed Cotton" },
    gsm: { type: Number, min: 50, max: 600 },
    careInstructions: { type: [String], default: ["Machine wash cold", "Do not bleach", "Iron low heat"] },
    sizeGuide: { type: [SizeGuideRowSchema], default: [] },
    images: { type: [ProductImageSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    totalStock: { type: Number, default: 0, min: 0, index: true },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isFlashSale: { type: Boolean, default: false, index: true },
    soldCount: { type: Number, default: 0, min: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });
ProductSchema.index({ name: "text", shortDescription: "text", tags: "text" });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
