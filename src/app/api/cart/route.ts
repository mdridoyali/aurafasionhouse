import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { cartItemInputSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

async function hydrateCartItems(rawItems: Array<{ productId: Types.ObjectId; sku: string; quantity: number }>) {
  if (rawItems.length === 0) return [];
  const productIds = rawItems.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isDeleted: false,
    isActive: true,
  }).lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const hydrated = [];

  for (const item of rawItems) {
    const product = productMap.get(item.productId.toString());
    if (!product) continue;
    const variant = product.variants.find((v) => v.sku === item.sku);
    if (!variant) continue;

    const colorImg = product.images.find(
      (img) => img.color && img.color.toLowerCase() === variant.color.toLowerCase()
    );
    const image = variant.image || colorImg?.url || product.images[0]?.url || "/images/placeholder-garment.svg";

    hydrated.push({
      productId: product._id.toString(),
      slug: product.slug,
      name: product.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      quantity: Math.min(item.quantity, Math.max(1, variant.stock)),
      image,
    });
  }
  return hydrated;
}

export async function GET() {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonOk({ items: [] });

    await connectDB();
    const cart = await Cart.findOne({ userId: user.id }).lean();
    const items = await hydrateCartItems(cart?.items ?? []);
    return jsonOk({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const { productId, sku, quantity } = cartItemInputSchema.parse(body);
    if (!Types.ObjectId.isValid(productId)) return jsonError("Invalid product ID.", 400);

    await connectDB();
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
    }).lean();
    if (!product) return jsonError("Product not found.", 404);

    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) return jsonError("Selected size/color variant not found.", 404);
    if (variant.stock < 1) return jsonError("This variant is out of stock.", 400);

    const clampedQty = Math.min(quantity, variant.stock);
    let cart = await Cart.findOne({ userId: user.id });
    if (!cart) {
      cart = new Cart({ userId: new Types.ObjectId(user.id), items: [] });
    }

    const existing = cart.items.find(
      (i) => i.productId.toString() === productId && i.sku === sku
    );
    if (existing) {
      existing.quantity = Math.min(clampedQty, variant.stock);
    } else {
      cart.items.push({
        productId: new Types.ObjectId(productId),
        sku,
        size: variant.size,
        color: variant.color,
        quantity: clampedQty,
      });
    }

    await cart.save();
    const items = await hydrateCartItems(cart.items);
    return jsonOk({ items, clamped: clampedQty < quantity });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuthForApi();
    if (!user) return jsonError("Unauthorized", 401);

    const sku = request.nextUrl.searchParams.get("sku")?.toUpperCase();
    await connectDB();

    if (!sku) {
      await Cart.findOneAndUpdate({ userId: user.id }, { $set: { items: [] } });
      return jsonOk({ items: [] });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: user.id },
      { $pull: { items: { sku } } },
      { new: true }
    ).lean();

    const items = await hydrateCartItems(cart?.items ?? []);
    return jsonOk({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
