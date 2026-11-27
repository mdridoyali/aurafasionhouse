import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".") || "input"}: ${firstIssue.message}`
      : "Invalid request data.";
    return jsonError(message, 400);
  }
  if (err instanceof Error) {
    if (err.name === "InsufficientStockError" || err.name === "PaymentValidationError") {
      return jsonError(err.message, 400);
    }
    const mongoErr = err as Error & { code?: number };
    if (mongoErr.code === 11000) {
      return jsonError("Duplicate value detected (SKU, slug, or Transaction ID already exists).", 409);
    }
    return jsonError(err.message || "Unexpected server error.", 500);
  }
  return jsonError("Unexpected server error.", 500);
}
