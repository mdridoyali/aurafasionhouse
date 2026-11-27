import { NextRequest } from "next/server";
import { z } from "zod";
import { requireStaffForApi } from "@/lib/auth/session";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  generateSignedUploadParams,
  isCloudinaryConfigured,
  MAX_IMAGE_BYTES,
  verifyCloudinaryAsset,
} from "@/lib/cloudinary";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-response";

const signRequestSchema = z.object({
  folder: z.enum(["aura-fashion/products", "aura-fashion/banners", "aura-fashion/categories"]).default("aura-fashion/products"),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
});

const verifySchema = z.object({
  publicId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaffForApi();
    if (!staff) return jsonError("Forbidden", 403);

    if (!isCloudinaryConfigured()) {
      return jsonError("Cloudinary is not configured in environment variables.", 503);
    }

    const body = await request.json();

    if ("publicId" in body) {
      const { publicId } = verifySchema.parse(body);
      const verification = await verifyCloudinaryAsset(publicId);
      if (!verification.valid) {
        return jsonError("Uploaded image failed server-side type or size validation.", 400);
      }
      return jsonOk(verification);
    }

    const { folder, mimeType, fileSize } = signRequestSchema.parse(body);
    if (mimeType && !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return jsonError("Only JPEG, PNG, WebP, and AVIF images are allowed.", 400);
    }
    if (fileSize && fileSize > MAX_IMAGE_BYTES) {
      return jsonError("Image must be 5 MB or smaller.", 400);
    }

    const signed = generateSignedUploadParams(folder);
    return jsonOk(signed);
  } catch (err) {
    return handleApiError(err);
  }
}
