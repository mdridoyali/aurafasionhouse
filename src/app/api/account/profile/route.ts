import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { User } from "@/models/User";
import { addressSchema, profileUpdateSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Unauthorized", 401);

    await connectDB();
    const user = await User.findById(sessionUser.id)
      .select("name email phone photoURL role emailVerified addresses wishlist createdAt")
      .lean();
    if (!user) return jsonError("User not found", 404);

    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = profileUpdateSchema.parse(body);

    await connectDB();
    const updated = await User.findByIdAndUpdate(
      sessionUser.id,
      { $set: { name: parsed.name, phone: parsed.phone } },
      { new: true }
    )
      .select("name email phone photoURL role emailVerified addresses")
      .lean();

    return jsonOk({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = addressSchema.parse(body);

    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) return jsonError("User not found", 404);

    if (parsed.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      parsed.isDefault = true;
    }

    user.addresses.push(parsed as never);
    await user.save();

    return jsonOk({ addresses: user.addresses }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
