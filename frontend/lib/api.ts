import { ImportResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {}

/**
 * Uploads a CSV file to the backend for AI extraction. Throws ApiError
 * with a user-friendly message on failure.
 */
export async function importCsvFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Could not reach the import server. Is the backend running?"
    );
  }

  if (!response.ok) {
    let message = `Import failed (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new ApiError(message);
  }

  return (await response.json()) as ImportResult;
}
