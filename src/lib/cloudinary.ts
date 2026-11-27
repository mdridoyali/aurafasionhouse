import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary environment variables are missing.");
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export function generateSignedUploadParams(folder = "aura-fashion/products") {
  const cld = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };
  const signature = cld.utils.api_sign_request(paramsToSign, env.cloudinaryApiSecret);

  return {
    signature,
    timestamp,
    folder,
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
  };
}

export async function verifyCloudinaryAsset(publicId: string): Promise<{
  valid: boolean;
  url?: string;
  format?: string;
  bytes?: number;
}> {
  const cld = getCloudinary();
  try {
    const resource = await cld.api.resource(publicId, { resource_type: "image" });
    const allowedFormats = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
    if (!allowedFormats.has(String(resource.format).toLowerCase())) {
      return { valid: false };
    }
    if (Number(resource.bytes) > MAX_IMAGE_BYTES) {
      return { valid: false };
    }
    return {
      valid: true,
      url: resource.secure_url,
      format: resource.format,
      bytes: resource.bytes,
    };
  } catch {
    return { valid: false };
  }
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  const cld = getCloudinary();
  try {
    await cld.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Best-effort cleanup
  }
}
