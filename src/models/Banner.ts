import "server-only";
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
  imagePublicId?: string;
  mobileImageUrl?: string;
  placement: "hero" | "promo" | "category_spotlight";
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    subtitle: { type: String, trim: true, maxlength: 260 },
    badge: { type: String, trim: true, maxlength: 40 },
    ctaText: { type: String, trim: true, maxlength: 40 },
    ctaLink: { type: String, trim: true, maxlength: 240 },
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true },
    mobileImageUrl: { type: String, trim: true },
    placement: {
      type: String,
      enum: ["hero", "promo", "category_spotlight"],
      default: "hero",
      index: true,
    },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);
