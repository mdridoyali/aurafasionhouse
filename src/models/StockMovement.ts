import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type StockMovementReason =
  | "order_placed"
  | "order_cancelled"
  | "payment_rejected"
  | "order_returned_resellable"
  | "manual_adjustment"
  | "exchange_out"
  | "exchange_in"
  | "initial_seed";

export interface IStockMovement extends Document {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  size: string;
  color: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: StockMovementReason;
  note?: string;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  performedBy?: Types.ObjectId;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true, uppercase: true, index: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    change: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        "order_placed",
        "order_cancelled",
        "payment_rejected",
        "order_returned_resellable",
        "manual_adjustment",
        "exchange_out",
        "exchange_in",
        "initial_seed",
      ],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 300 },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    orderNumber: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ createdAt: -1 });

export const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>("StockMovement", StockMovementSchema);
