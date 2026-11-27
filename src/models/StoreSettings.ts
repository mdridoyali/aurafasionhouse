import "server-only";
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IStoreSettings extends Document {
  key: string;
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
  lowStockAlertThreshold: number;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: { type: String, default: "default", unique: true },
    storeName: { type: String, default: "AURA Fashion House" },
    tagline: { type: String, default: "Minimal Everyday Menswear & Essentials" },
    insideDhakaCharge: { type: Number, default: 80, min: 0 },
    outsideDhakaCharge: { type: Number, default: 160, min: 0 },
    freeDeliveryThreshold: { type: Number, default: 0, min: 0 },
    bkashMerchantNumber: { type: String, default: "01700-000000" },
    bkashInstructions: {
      type: String,
      default:
        "Use bKash Payment or Send Money to our merchant number, then enter your bKash sender number and Transaction ID (TrxID).",
    },
    nagadMerchantNumber: { type: String, default: "01800-000000" },
    nagadInstructions: {
      type: String,
      default:
        "Use Nagad Payment or Send Money to our merchant number, then enter your Nagad sender number and Transaction ID.",
    },
    whatsappNumber: { type: String, default: "8801700000000" },
    supportPhone: { type: String, default: "+880 1700-000000" },
    supportEmail: { type: String, default: "care@aurafashion.com.bd" },
    address: { type: String, default: "House 24, Road 11, Banani, Dhaka 1213, Bangladesh" },
    promoStripText: {
      type: String,
      default: "Inside Dhaka ৳80 • Outside Dhaka ৳160 • 7-Day Easy Size Exchange • bKash, Nagad & COD",
    },
    lowStockAlertThreshold: { type: Number, default: 5, min: 1 },
  },
  { timestamps: true }
);

export const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);

export async function getOrCreateStoreSettings(): Promise<IStoreSettings> {
  let settings = await StoreSettings.findOne({ key: "default" });
  if (!settings) {
    settings = await StoreSettings.create({ key: "default" });
  }
  return settings;
}
