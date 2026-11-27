import "server-only";
import type { ClientSession, Types } from "mongoose";
import { Product } from "@/models/Product";
import { Order, type IOrder, type IOrderItem } from "@/models/Order";
import { StockMovement, type StockMovementReason } from "@/models/StockMovement";

export class InsufficientStockError extends Error {
  sku: string;
  productName: string;
  constructor(productName: string, sku: string) {
    super(`Insufficient stock for ${productName} (${sku}).`);
    this.name = "InsufficientStockError";
    this.productName = productName;
    this.sku = sku;
  }
}

export async function reserveOrderStock(params: {
  items: IOrderItem[];
  orderId: Types.ObjectId;
  orderNumber: string;
  actorId: Types.ObjectId;
  session: ClientSession;
}): Promise<void> {
  const { items, orderId, orderNumber, actorId, session } = params;

  for (const item of items) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        isDeleted: false,
        isActive: true,
        variants: {
          $elemMatch: {
            sku: item.sku,
            stock: { $gte: item.quantity },
          },
        },
      },
      {
        $inc: {
          "variants.$.stock": -item.quantity,
          totalStock: -item.quantity,
          soldCount: item.quantity,
        },
      },
      { session, new: true }
    );

    if (!updatedProduct) {
      throw new InsufficientStockError(item.name, item.sku);
    }

    const updatedVariant = updatedProduct.variants.find((v) => v.sku === item.sku);
    const newStock = updatedVariant ? updatedVariant.stock : 0;

    await StockMovement.create(
      [
        {
          productId: item.productId,
          productName: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          change: -item.quantity,
          previousStock: newStock + item.quantity,
          newStock,
          reason: "order_placed",
          note: `Order ${orderNumber} placed`,
          orderId,
          orderNumber,
          performedBy: actorId,
        },
      ],
      { session }
    );
  }
}

/**
 * Restores stock for an order exactly once using an atomic stockRestored guard.
 * Returns true if stock was restored by this call, false if it was already restored.
 */
export async function restoreOrderStockOnce(params: {
  order: IOrder;
  reason: Extract<
    StockMovementReason,
    "order_cancelled" | "payment_rejected" | "order_returned_resellable"
  >;
  note: string;
  actorId: Types.ObjectId;
  session: ClientSession;
}): Promise<boolean> {
  const { order, reason, note, actorId, session } = params;

  const guarded = await Order.findOneAndUpdate(
    {
      _id: order._id,
      stockDeducted: true,
      stockRestored: false,
    },
    {
      $set: { stockRestored: true },
    },
    { session, new: true }
  );

  if (!guarded) {
    return false;
  }

  for (const item of order.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        "variants.sku": item.sku,
      },
      {
        $inc: {
          "variants.$.stock": item.quantity,
          totalStock: item.quantity,
          soldCount: -item.quantity,
        },
      },
      { session, new: true }
    );

    if (updatedProduct) {
      // Ensure soldCount never drops below 0
      if (updatedProduct.soldCount < 0) {
        updatedProduct.soldCount = 0;
        await updatedProduct.save({ session });
      }
      const variant = updatedProduct.variants.find((v) => v.sku === item.sku);
      const newStock = variant ? variant.stock : item.quantity;

      await StockMovement.create(
        [
          {
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            change: item.quantity,
            previousStock: Math.max(0, newStock - item.quantity),
            newStock,
            reason,
            note,
            orderId: order._id,
            orderNumber: order.orderNumber,
            performedBy: actorId,
          },
        ],
        { session }
      );
    }
  }

  return true;
}

export async function manualAdjustVariantStock(params: {
  productId: string;
  sku: string;
  delta: number;
  note: string;
  actorId: Types.ObjectId;
  session: ClientSession;
}): Promise<{ newStock: number; totalStock: number }> {
  const { productId, sku, delta, note, actorId, session } = params;
  const upperSku = sku.trim().toUpperCase();

  const filter: Record<string, unknown> = {
    _id: productId,
    isDeleted: false,
    "variants.sku": upperSku,
  };

  if (delta < 0) {
    filter.variants = {
      $elemMatch: {
        sku: upperSku,
        stock: { $gte: Math.abs(delta) },
      },
    };
  }

  const updated = await Product.findOneAndUpdate(
    filter,
    {
      $inc: {
        "variants.$.stock": delta,
        totalStock: delta,
      },
    },
    { session, new: true }
  );

  if (!updated) {
    throw new Error("Product/SKU not found or adjustment would cause negative stock.");
  }

  const variant = updated.variants.find((v) => v.sku === upperSku);
  if (!variant) {
    throw new Error("Variant not found.");
  }

  await StockMovement.create(
    [
      {
        productId: updated._id,
        productName: updated.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        change: delta,
        previousStock: variant.stock - delta,
        newStock: variant.stock,
        reason: "manual_adjustment",
        note,
        performedBy: actorId,
      },
    ],
    { session }
  );

  return { newStock: variant.stock, totalStock: updated.totalStock };
}

export async function approveExchangeVariantStock(params: {
  order: IOrder;
  exchangeId: string;
  staffId: Types.ObjectId;
  staffNote?: string;
  session: ClientSession;
}): Promise<void> {
  const { order, exchangeId, staffId, staffNote, session } = params;

  const exchange = order.exchangeRequests.find((e) => e._id.toString() === exchangeId);
  if (!exchange) {
    throw new Error("Exchange request not found.");
  }
  if (exchange.status !== "pending") {
    throw new Error("Exchange request has already been resolved.");
  }

  const orderItem = order.items.find((i) => i.sku === exchange.itemSku);
  if (!orderItem) {
    throw new Error("Original order item not found.");
  }

  const product = await Product.findById(orderItem.productId).session(session);
  if (!product) {
    throw new Error("Product no longer exists.");
  }

  const targetVariant = product.variants.find(
    (v) =>
      v.size.toLowerCase() === exchange.requestedSize.toLowerCase() &&
      v.color.toLowerCase() === exchange.requestedColor.toLowerCase()
  );

  if (!targetVariant) {
    throw new Error("Requested replacement size/color variant not found.");
  }

  // Deduct replacement variant atomically
  const deducted = await Product.findOneAndUpdate(
    {
      _id: product._id,
      variants: {
        $elemMatch: {
          sku: targetVariant.sku,
          stock: { $gte: 1 },
        },
      },
    },
    {
      $inc: {
        "variants.$.stock": -1,
        totalStock: -1,
      },
    },
    { session, new: true }
  );

  if (!deducted) {
    throw new InsufficientStockError(product.name, targetVariant.sku);
  }

  // Restore original variant atomically
  const restored = await Product.findOneAndUpdate(
    {
      _id: product._id,
      "variants.sku": orderItem.sku,
    },
    {
      $inc: {
        "variants.$.stock": 1,
        totalStock: 1,
      },
    },
    { session, new: true }
  );

  const restoredVariant = restored?.variants.find((v) => v.sku === orderItem.sku);
  const deductedVariant = restored?.variants.find((v) => v.sku === targetVariant.sku);

  await StockMovement.create(
    [
      {
        productId: product._id,
        productName: product.name,
        sku: orderItem.sku,
        size: orderItem.size,
        color: orderItem.color,
        change: 1,
        previousStock: (restoredVariant?.stock ?? 1) - 1,
        newStock: restoredVariant?.stock ?? 1,
        reason: "exchange_in",
        note: `Size exchange approved on ${order.orderNumber}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        performedBy: staffId,
      },
      {
        productId: product._id,
        productName: product.name,
        sku: targetVariant.sku,
        size: targetVariant.size,
        color: targetVariant.color,
        change: -1,
        previousStock: (deductedVariant?.stock ?? 0) + 1,
        newStock: deductedVariant?.stock ?? 0,
        reason: "exchange_out",
        note: `Replacement dispatched for ${order.orderNumber}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        performedBy: staffId,
      },
    ],
    { session, ordered: true }
  );

  exchange.status = "approved";
  exchange.newSku = targetVariant.sku;
  exchange.staffNote = staffNote;
  exchange.resolvedAt = new Date();
  exchange.resolvedBy = staffId;
  await order.save({ session });
}
