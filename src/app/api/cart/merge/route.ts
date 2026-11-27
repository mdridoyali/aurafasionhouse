import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { cartMergeSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const { items: guestItems } = cartMergeSchema.parse(body);

    await connectDB();
    let cart = await Cart.findOne({ userId: user.id });
    if (!cart) {
      cart = new Cart({ userId: new Types.ObjectId(user.id), items: [] });
    }

    if (guestItems.length > 0) {
      const productIds = guestItems
        .map((g) => g.productId)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      const products = await Product.find({
        _id: { $in: productIds },
        isDeleted: false,
        isActive: true,
      }).lean();

      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      for (const guest of guestItems) {
        const product = productMap.get(guest.productId);
        if (!product) continue;
        const variant = product.variants.find((v) => v.sku === guest.sku);
        if (!variant || variant.stock < 1) continue;

        const existing = cart.items.find(
          (i) => i.productId.toString() === guest.productId && i.sku === guest.sku
        );
        if (existing) {
          existing.quantity = Math.min(existing.quantity + guest.quantity, variant.stock);
        } else {
          cart.items.push({
            productId: product._id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            quantity: Math.min(guest.quantity, variant.stock),
          });
        }
      }
      await cart.save();
    }

    return jsonOk({ merged: true });
  } catch (err) {
    return handleApiError(err);
  }
}
