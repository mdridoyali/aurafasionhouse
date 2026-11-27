import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { Brand } from "@/models/Brand";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    await connectDB();
    await Brand.deleteOne({ _id: id });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
