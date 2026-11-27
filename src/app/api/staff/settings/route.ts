import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { StoreSettings } from "@/models/StoreSettings";
import { storeSettingsSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = storeSettingsSchema.parse(body);

    await connectDB();
    const settings = await StoreSettings.findOneAndUpdate(
      { key: "default" },
      { $set: parsed },
      { new: true, upsert: true }
    );

    return jsonOk({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
