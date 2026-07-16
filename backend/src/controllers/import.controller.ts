import { Request, Response, NextFunction } from "express";
import { chunk, parseCsvBuffer, CsvParseError } from "../services/csvParser.service";
import { extractBatchWithGemini, GeminiExtractionError } from "../services/gemini.service";
import { validateExtractedRecord } from "../services/validator.service";
import { CrmRecord, ImportResult, RawCsvRow, SkippedRecord } from "../types/crm";

const AI_BATCH_SIZE = Number(process.env.AI_BATCH_SIZE ?? 15);

export async function importCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file was uploaded. Field name must be 'file'." });
      return;
    }

    let rows: RawCsvRow[];
    try {
      rows = parseCsvBuffer(req.file.buffer);
    } catch (err) {
      if (err instanceof CsvParseError) {
        res.status(422).json({ error: err.message });
        return;
      }
      throw err;
    }

    const batches = chunk(rows, AI_BATCH_SIZE);
    const imported: CrmRecord[] = [];
    const skipped: SkippedRecord[] = [];

    // Batches are processed sequentially with per-batch fault isolation:
    // a single failed batch is recorded as skipped rows with a clear
    // reason instead of failing the entire import.
    let rowIndex = 0;
    for (const batch of batches) {
      const startIndex = rowIndex;
      try {
        const candidates = await extractBatchWithGemini(batch);
        candidates.forEach((candidate, i) => {
          const originalRow = batch[i];
          const outcome = validateExtractedRecord(candidate, originalRow);
          if (outcome.valid && outcome.record) {
            imported.push(outcome.record);
          } else {
            skipped.push({
              row: originalRow,
              rowIndex: startIndex + i,
              reason: outcome.reason ?? "Record failed validation.",
            });
          }
        });
      } catch (err) {
        const reason =
          err instanceof GeminiExtractionError
            ? err.message
            : "AI extraction failed for this batch.";
        batch.forEach((row, i) => {
          skipped.push({ row, rowIndex: startIndex + i, reason });
        });
      }
      rowIndex += batch.length;
    }

    const result: ImportResult = {
      totalRows: rows.length,
      totalImported: imported.length,
      totalSkipped: skipped.length,
      imported,
      skipped,
    };

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
