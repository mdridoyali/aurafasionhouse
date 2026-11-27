import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ICouponUsage {
  userId: Types.ObjectId;
  count: number;
}

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt: Date;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  usedBy: ICouponUsage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 1 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    usedBy: { type: [CouponUsageSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
