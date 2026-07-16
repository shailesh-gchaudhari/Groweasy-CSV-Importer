import Papa from "papaparse";
import { RawCsvRow } from "./types";

export interface ParsedCsvPreview {
  headers: string[];
  rows: RawCsvRow[];
  totalRowCount: number;
}

const PREVIEW_ROW_LIMIT = 100;

/**
 * Parses a CSV File in the browser purely for preview purposes. No AI
 * processing happens here — this only renders what the user uploaded.
 */
export function parseCsvForPreview(file: File): Promise<ParsedCsvPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        if (!result.data.length) {
          reject(new Error("This CSV file has no data rows."));
          return;
        }
        resolve({
          headers: result.meta.fields ?? Object.keys(result.data[0]),
          rows: result.data.slice(0, PREVIEW_ROW_LIMIT),
          totalRowCount: result.data.length,
        });
      },
      error: (err: Error) => reject(err),
    });
  });
}
