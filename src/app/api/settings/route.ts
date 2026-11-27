import { connectDB } from "@/lib/db";
import { getOrCreateStoreSettings } from "@/models/StoreSettings";
import { handleApiError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    await connectDB();
    const settings = await getOrCreateStoreSettings();
    return jsonOk({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
