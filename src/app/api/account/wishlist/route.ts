import { NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const toggleSchema = z.object({
  productId: z.string().min(1),
});

export async function GET() {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonOk({ wishlist: [] });

    await connectDB();
    const user = await User.findById(sessionUser.id).select("wishlist").lean();
    if (!user) return jsonOk({ wishlist: [] });

    const products = await Product.find({
      _id: { $in: user.wishlist },
      isDeleted: false,
      isActive: true,
    })
      .populate("category", "name slug")
      .lean();

    return jsonOk({ wishlist: products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Please sign in to save items to your wishlist.", 401);

    const body = await request.json();
    const { productId } = toggleSchema.parse(body);

    if (!Types.ObjectId.isValid(productId)) {
      return jsonError("Invalid product ID.", 400);
    }

    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) return jsonError("User not found", 404);

    const exists = user.wishlist.some((id) => id.toString() === productId);
    if (exists) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    } else {
      user.wishlist.push(new Types.ObjectId(productId));
    }
    await user.save();

    return jsonOk({
      saved: !exists,
      wishlistIds: user.wishlist.map((id) => id.toString()),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
