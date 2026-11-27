import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/rbac";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";
import { Order, type IOrderItem } from "@/models/Order";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { getPaymentProcessor } from "@/lib/payment";
import { reserveOrderStock } from "@/lib/inventory";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `AUR-${y}${m}${d}-${rand}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    await connectDB();
    const sp = request.nextUrl.searchParams;
    const scope = sp.get("scope");

    const filter: Record<string, unknown> = {};
    if (scope === "staff" && isStaffRole(user.role)) {
      const status = sp.get("status");
      const paymentStatus = sp.get("paymentStatus");
      const paymentMethod = sp.get("paymentMethod");
      const q = sp.get("q")?.trim();
      if (status) filter.orderStatus = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (paymentMethod) filter.paymentMethod = paymentMethod;
      if (q) {
        filter.$or = [
          { orderNumber: { $regex: q, $options: "i" } },
          { "shippingAddress.phone": { $regex: q, $options: "i" } },
          { "shippingAddress.fullName": { $regex: q, $options: "i" } },
          { "paymentDetails.transactionId": { $regex: q, $options: "i" } },
        ];
      }
    } else {
      filter.userId = new Types.ObjectId(user.id);
    }

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return jsonOk({ orders, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Please sign in to place an order.", 401);

    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`order:create:${user.id}:${ip}`, 10, 5 * 60_000);
    if (!rl.allowed) {
      return jsonError("Too many order attempts. Please wait a minute and try again.", 429);
    }

    const body = await request.json();
    const parsed = checkoutSchema.parse(body);

    await connectDB();

    // Idempotency check prevents duplicate orders on double-click or network retry
    const existingOrder = await Order.findOne({
      idempotencyKey: parsed.idempotencyKey,
      userId: user.id,
    }).lean();
    if (existingOrder) {
      return jsonOk({ order: existingOrder, deduplicated: true });
    }

    const settings = await getOrCreateStoreSettings();
    const session = await mongoose.startSession();
    let createdOrderId: string | null = null;

    try {
      await session.withTransaction(async () => {
        const cart = await Cart.findOne({ userId: user.id }).session(session);
        if (!cart || cart.items.length === 0) {
          throw new Error("Your cart is empty.");
        }

        const productIds = cart.items.map((i) => i.productId);
        const products = await Product.find({
          _id: { $in: productIds },
          isDeleted: false,
          isActive: true,
        }).session(session);

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        const orderItems: IOrderItem[] = [];
        let subtotal = 0;

        for (const cartItem of cart.items) {
          const product = productMap.get(cartItem.productId.toString());
          if (!product) {
            throw new Error("A product in your cart is no longer available.");
          }
          const variant = product.variants.find((v) => v.sku === cartItem.sku);
          if (!variant) {
            throw new Error(`Variant ${cartItem.sku} is no longer available.`);
          }
          if (variant.stock < cartItem.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name} (${variant.size} / ${variant.color}). Available: ${variant.stock}.`
            );
          }

          const colorImg = product.images.find(
            (img) => img.color && img.color.toLowerCase() === variant.color.toLowerCase()
          );
          const image =
            variant.image ||
            colorImg?.url ||
            product.images[0]?.url ||
            "/images/placeholder-garment.svg";

          const lineTotal = variant.price * cartItem.quantity;
          subtotal += lineTotal;

          orderItems.push({
            productId: product._id,
            sku: variant.sku,
            name: product.name,
            slug: product.slug,
            size: variant.size,
            color: variant.color,
            image,
            unitPrice: variant.price,
            quantity: cartItem.quantity,
            lineTotal,
          });
        }

        // Coupon recalculation on server
        let discount = 0;
        let appliedCouponCode: string | undefined;
        if (parsed.couponCode) {
          const code = parsed.couponCode.trim().toUpperCase();
          const coupon = await Coupon.findOne({ code, isActive: true }).session(session);
          if (!coupon) throw new Error("Invalid or inactive coupon code.");
          if (coupon.expiresAt.getTime() < Date.now()) throw new Error("Coupon has expired.");
          if (subtotal < coupon.minOrderAmount) {
            throw new Error(`Minimum order ৳${coupon.minOrderAmount} required for coupon ${code}.`);
          }
          if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new Error("Coupon total usage limit reached.");
          }
          const existingUsage = coupon.usedBy.find((u) => u.userId.toString() === user.id);
          if (existingUsage && existingUsage.count >= coupon.perUserLimit) {
            throw new Error("You have already reached the usage limit for this coupon.");
          }

          discount =
            coupon.type === "percent"
              ? Math.round((subtotal * coupon.value) / 100)
              : Math.round(coupon.value);
          if (coupon.type === "percent" && coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
          discount = Math.min(discount, subtotal);
          appliedCouponCode = coupon.code;

          coupon.usedCount += 1;
          if (existingUsage) {
            existingUsage.count += 1;
          } else {
            coupon.usedBy.push({ userId: new Types.ObjectId(user.id), count: 1 });
          }
          await coupon.save({ session });
        }

        // Authoritative server delivery charge (Inside Dhaka 80 TK, Outside Dhaka 160 TK by default)
        let deliveryCharge =
          parsed.deliveryZone === "inside_dhaka"
            ? settings.insideDhakaCharge
            : settings.outsideDhakaCharge;
        if (
          settings.freeDeliveryThreshold > 0 &&
          subtotal - discount >= settings.freeDeliveryThreshold
        ) {
          deliveryCharge = 0;
        }

        const total = Math.max(0, subtotal - discount + deliveryCharge);
        const orderNumber = generateOrderNumber();

        const processor = getPaymentProcessor(parsed.paymentMethod);
        const paymentInit = await processor.initializePayment({
          orderNumber,
          amount: total,
          senderNumber: parsed.senderNumber,
          transactionId: parsed.transactionId,
        });

        // Ensure Transaction ID uniqueness before insert if bKash/Nagad
        if (paymentInit.transactionId) {
          const dupTrx = await Order.exists({
            "paymentDetails.transactionId": paymentInit.transactionId,
          }).session(session);
          if (dupTrx) {
            throw new Error("This Transaction ID has already been used for another order.");
          }
        }

        const orderId = new Types.ObjectId();
        const paymentDetails: Record<string, unknown> = {
          provider: paymentInit.provider,
        };
        if (paymentInit.senderNumber) paymentDetails.senderNumber = paymentInit.senderNumber;
        if (paymentInit.transactionId) paymentDetails.transactionId = paymentInit.transactionId;
        if (paymentInit.gatewayRef) paymentDetails.gatewayRef = paymentInit.gatewayRef;

        const [order] = await Order.create(
          [
            {
              _id: orderId,
              orderNumber,
              idempotencyKey: parsed.idempotencyKey,
              userId: new Types.ObjectId(user.id),
              items: orderItems,
              shippingAddress: {
                ...parsed.shippingAddress,
                isInsideDhaka: parsed.deliveryZone === "inside_dhaka",
              },
              deliveryZone: parsed.deliveryZone,
              subtotal,
              discount,
              couponCode: appliedCouponCode,
              deliveryCharge,
              total,
              paymentMethod: parsed.paymentMethod,
              paymentStatus: paymentInit.paymentStatus,
              paymentDetails,
              orderStatus: "pending",
              statusHistory: [
                {
                  status: "pending",
                  note:
                    parsed.paymentMethod === "cod"
                      ? "Order placed with Cash on Delivery"
                      : `Order placed with ${parsed.paymentMethod.toUpperCase()} (pending verification)`,
                  changedBy: new Types.ObjectId(user.id),
                  changedAt: new Date(),
                },
              ],
              stockDeducted: true,
              stockRestored: false,
            },
          ],
          { session }
        );

        await reserveOrderStock({
          items: orderItems,
          orderId: order!._id,
          orderNumber,
          actorId: new Types.ObjectId(user.id),
          session,
        });

        cart.items = [];
        await cart.save({ session });
        createdOrderId = order!._id.toString();
      });
    } finally {
      await session.endSession();
    }

    const createdOrder = await Order.findById(createdOrderId).lean();
    return jsonOk({ order: createdOrder }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
