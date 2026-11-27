import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuthForApi } from "@/lib/auth/session";
import { User } from "@/models/User";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) return jsonError("User not found", 404);

    user.addresses = user.addresses.filter((a) => a._id.toString() !== id) as typeof user.addresses;
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0]!.isDefault = true;
    }
    await user.save();

    return jsonOk({ addresses: user.addresses });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuthForApi();
    if (!sessionUser) return jsonError("Unauthorized", 401);

    const { id } = await context.params;
    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) return jsonError("User not found", 404);

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === id;
    });
    await user.save();

    return jsonOk({ addresses: user.addresses });
  } catch (err) {
    return handleApiError(err);
  }
}
