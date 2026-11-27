import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Banner } from "@/models/Banner";
import { bannerSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    if (includeInactive) {
      const staff = await requireStaffForApi();
      if (!staff) return jsonError("Forbidden", 403);
    }

    const filter = includeInactive ? {} : { isActive: true };
    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return jsonOk({ banners });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = bannerSchema.parse(body);

    await connectDB();
    const banner = await Banner.create(parsed);
    return jsonOk({ banner }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
