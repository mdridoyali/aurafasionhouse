import "server-only";
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod = "cod" | "bkash" | "nagad";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "rejected" | "refunded";
export type DeliveryZone = "inside_dhaka" | "outside_dhaka";

export interface IOrderItem {
  productId: Types.ObjectId;
  sku: string;
  name: string;
  slug: string;
  size: string;
  color: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  changedAt: Date;
}

export interface IExchangeRequest {
  _id: Types.ObjectId;
  itemSku: string;
  requestedSize: string;
  requestedColor: string;
  newSku?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  staffNote?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  idempotencyKey?: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    street: string;
    isInsideDhaka: boolean;
  };
  deliveryZone: DeliveryZone;
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails: {
    provider: string;
    senderNumber?: string;
    transactionId?: string;
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    rejectionReason?: string;
    gatewayRef?: string;
  };
  orderStatus: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  stockDeducted: boolean;
  stockRestored: boolean;
  cancelReason?: string;
  cancelledBy?: Types.ObjectId;
  returnResellable?: boolean;
  exchangeRequests: IExchangeRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      required: true,
    },
    note: { type: String, trim: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ExchangeRequestSchema = new Schema<IExchangeRequest>(
  {
    itemSku: { type: String, required: true, uppercase: true },
    requestedSize: { type: String, required: true },
    requestedColor: { type: String, required: true },
    newSku: { type: String, uppercase: true },
    reason: { type: String, required: true, maxlength: 300 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    staffNote: { type: String, maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      division: { type: String, required: true },
      district: { type: String, required: true },
      area: { type: String, required: true },
      street: { type: String, required: true },
      isInsideDhaka: { type: Boolean, required: true },
    },
    deliveryZone: { type: String, enum: ["inside_dhaka", "outside_dhaka"], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, uppercase: true, trim: true },
    deliveryCharge: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod", "bkash", "nagad"], required: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending_verification", "paid", "rejected", "refunded"],
      default: "unpaid",
      index: true,
    },
    paymentDetails: {
      provider: { type: String, required: true },
      senderNumber: { type: String, trim: true },
      transactionId: { type: String, trim: true, uppercase: true },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
      gatewayRef: { type: String, trim: true },
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    stockDeducted: { type: Boolean, default: false },
    stockRestored: { type: Boolean, default: false },
    cancelReason: { type: String, trim: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    returnResellable: { type: Boolean },
    exchangeRequests: { type: [ExchangeRequestSchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
OrderSchema.index({ "paymentDetails.transactionId": 1 }, { unique: true, sparse: true });
OrderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
