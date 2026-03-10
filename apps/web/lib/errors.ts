import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(message: string, public readonly status = 500, public readonly expose = true) {
    super(message);
    this.name = "AppError";
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") { super(message, 401, true); }
}
export function logError(scope: string, error: unknown) { console.error(`[${scope}]`, error); }
export function toErrorResponse(error: unknown, fallbackMessage = "Internal server error") {
  if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed", details: error.flatten() }, { status: 400 });
  if (error instanceof AppError) return NextResponse.json({ error: error.expose ? error.message : fallbackMessage }, { status: error.status });
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
