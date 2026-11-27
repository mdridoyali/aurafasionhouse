import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`newsletter:${ip}`, 10, 10 * 60_000);
    if (!rl.allowed) return jsonError("Too many requests.", 429);

    const body = await request.json();
    const { email } = schema.parse(body);

    await connectDB();
    await NewsletterSubscriber.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $setOnInsert: { email: email.toLowerCase() } },
      { upsert: true }
    );

    return jsonOk({ subscribed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
