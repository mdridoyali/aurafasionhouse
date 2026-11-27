import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Brand } from "@/models/Brand";
import { brandSchema } from "@/lib/validators";
import { slugify } from "@/lib/format";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return jsonOk({ brands });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = brandSchema.parse(body);

    await connectDB();
    const brand = await Brand.create({
      ...parsed,
      slug: slugify(parsed.slug || parsed.name),
    });

    return jsonOk({ brand }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
