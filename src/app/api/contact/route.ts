import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireStaffForApi } from "@/lib/auth/session";
import { ContactMessage } from "@/models/ContactMessage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    await connectDB();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100).lean();
    return jsonOk({ messages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`contact:${ip}`, 5, 10 * 60_000);
    if (!rl.allowed) {
      return jsonError("Too many messages sent. Please try again later.", 429);
    }

    const body = await request.json();
    const parsed = contactSchema.parse(body);

    await connectDB();
    const msg = await ContactMessage.create(parsed);
    return jsonOk({ id: msg._id.toString() }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
