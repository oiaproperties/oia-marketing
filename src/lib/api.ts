import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError("Validation failed", 422, err.flatten().fieldErrors);
  }
  const msg = err instanceof Error ? err.message : "Internal server error";
  console.error("[API Error]", msg);
  return apiError(msg, 500);
}
