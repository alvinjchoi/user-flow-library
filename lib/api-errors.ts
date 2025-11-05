import { NextResponse } from "next/server";
import { ValidationError } from "./validators";

/**
 * Custom API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Predefined API errors for common scenarios
 */
export const APIErrors = {
  Unauthorized: () => new APIError(401, "Unauthorized"),
  Forbidden: () => new APIError(403, "Forbidden"),
  NotFound: (resource?: string) =>
    new APIError(404, resource ? `${resource} not found` : "Not found"),
  BadRequest: (message: string) => new APIError(400, message),
  InternalServerError: (message?: string) =>
    new APIError(500, message || "Internal server error"),
  ServiceUnavailable: (service: string) =>
    new APIError(503, `${service} is not available`),
  RateLimitExceeded: (service?: string) =>
    new APIError(
      429,
      service
        ? `${service} rate limit exceeded`
        : "Rate limit exceeded. Please try again later."
    ),
};

/**
 * Centralized error handler for API routes
 * Converts various error types into appropriate NextResponse objects
 */
export function handleAPIError(
  error: unknown,
  context?: string
): NextResponse {
  // Log the error with context
  const logPrefix = context ? `[API Error - ${context}]` : "[API Error]";
  console.error(logPrefix, error);

  // Handle APIError
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle ValidationError
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        field: error.field,
        ...(error.details && { details: error.details }),
      },
      { status: 400 }
    );
  }

  // Handle OpenAI specific errors
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status;
    const errorMessage = (error as any).message || "Unknown error";

    if (status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid" },
        { status: 503 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "OpenAI API rate limit exceeded" },
        { status: 429 }
      );
    }
    if (status === 500) {
      return NextResponse.json(
        { error: "OpenAI API error", details: errorMessage },
        { status: 503 }
      );
    }
  }

  // Handle Supabase errors
  if (error && typeof error === "object" && "code" in error) {
    const supabaseError = error as any;
    
    // PGRST116 = No rows returned
    if (supabaseError.code === "PGRST116") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Other Supabase errors
    return NextResponse.json(
      {
        error: "Database error",
        details: supabaseError.message || "Unknown database error",
      },
      { status: 500 }
    );
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Network error",
          details: error.message,
        },
        { status: 503 }
      );
    }

    if (error.message.includes("timeout")) {
      return NextResponse.json(
        {
          error: "Request timeout",
          details: error.message,
        },
        { status: 504 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    {
      error: "Internal server error",
      details: "An unexpected error occurred",
    },
    { status: 500 }
  );
}

/**
 * Wrapper for async API route handlers with automatic error handling
 * 
 * Usage:
 * export const GET = withErrorHandling(async (request) => {
 *   // Your route logic here
 *   return NextResponse.json({ data });
 * }, "GET /api/example");
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error, context);
    }
  };
}

/**
 * Asserts a condition and throws APIError if false
 */
export function assertExists<T>(
  value: T | null | undefined,
  errorMessage: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new APIError(404, errorMessage);
  }
}

/**
 * Asserts authorization and throws APIError if false
 */
export function assertAuthorized(
  condition: boolean,
  message: string = "Unauthorized"
): asserts condition {
  if (!condition) {
    throw new APIError(403, message);
  }
}

/**
 * Type guard to check if a value is a NextResponse
 */
export function isNextResponse(value: any): value is NextResponse {
  return value instanceof NextResponse;
}

