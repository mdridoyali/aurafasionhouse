import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { ContactMessage } from "@/models/ContactMessage";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const replySchema = z.object({
  status: z.enum(["new", "read", "replied"]),
  staffReply: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) return jsonError("Invalid ID", 400);

    const body = await request.json();
    const parsed = replySchema.parse(body);

    await connectDB();
    const updated = await ContactMessage.findByIdAndUpdate(id, { $set: parsed }, { new: true });
    if (!updated) return jsonError("Message not found", 404);
    return jsonOk({ message: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
