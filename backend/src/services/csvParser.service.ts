import Papa from "papaparse";
import { RawCsvRow } from "../types/crm";

export class CsvParseError extends Error {}

/**
 * Parses raw CSV file content into an array of row objects, keyed by
 * whatever headers exist in the file. Makes no assumption about column
 * names — that mapping is the AI's job.
 */
export function parseCsvBuffer(buffer: Buffer): RawCsvRow[] {
  const content = buffer.toString("utf-8");

  const result = Papa.parse<RawCsvRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });

  if (result.errors && result.errors.length > 0) {
    const fatal = result.errors.filter((e) => e.type !== "FieldMismatch");
    if (fatal.length > 0) {
      throw new CsvParseError(
        `Failed to parse CSV: ${fatal[0].message} (row ${fatal[0].row ?? "?"})`
      );
    }
  }

  if (result.data.length === 0) {
    throw new CsvParseError("CSV file contains no data rows.");
  }

  return result.data;
}

/** Splits an array into fixed-size chunks, preserving original order. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
