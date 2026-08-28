export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type ApiErrorPayload = {
  message?: unknown;
};

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}

/** Reads a server error without letting an invalid JSON response hide the useful fallback. */
export async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isApiErrorPayload(body) && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // Keep the caller-provided fallback for empty or non-JSON error responses.
  }
  return fallback;
}
