import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES, RawCsvRow } from "../types/crm";

const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES ?? 3);

const SYSTEM_INSTRUCTION = `
You are a data-mapping engine for a real-estate CRM called GrowEasy.
You will receive an array of raw lead rows extracted from an arbitrary CSV
(Facebook Lead Ads exports, Google Ads exports, Excel sheets, manual
spreadsheets, other CRM exports, etc). Column names and layouts vary between
files and are NOT fixed.

Your job: map each raw row onto the GrowEasy CRM schema below, using your
judgement about which source column(s) correspond to which CRM field, even
when column names are abbreviated, misspelled, in another case, or absent.

CRM fields to produce for every row (always include every key):
- created_at: lead creation date/time as an ISO-8601-ish string parseable by
  JavaScript's \`new Date(...)\`. If no date exists in the row, use "".
- name: the lead's full name.
- email: the PRIMARY email address only (first one found).
- country_code: phone country code, formatted like "+91". Infer from the
  phone number or locale context if not given explicitly; otherwise "".
- mobile_without_country_code: the PRIMARY mobile number, digits only, with
  the country code stripped off.
- company: company / organization name.
- city, state, country: location fields.
- lead_owner: the salesperson/agent/owner assigned to this lead, if present.
- crm_status: MUST be exactly one of ${CRM_STATUS_VALUES.join(", ")}, or ""
  if nothing in the row maps confidently to one of these.
- crm_note: free-text notes. Also append here (clearly labeled) any EXTRA
  email addresses or phone numbers beyond the primary ones, plus any other
  useful information from the row that doesn't fit a dedicated field.
- data_source: MUST be exactly one of ${DATA_SOURCE_VALUES.join(", ")}, or ""
  if nothing matches confidently. Never invent a value outside this list.
- possession_time: property possession timing, if this is real-estate data.
- description: any additional free-text description.

Rules:
1. Never invent data that isn't present or reasonably inferable from the row.
   Leave a field as "" (empty string) if unknown.
2. If a row has multiple emails, use the first as "email" and append the
   rest to "crm_note". Same rule for multiple phone numbers.
3. crm_status and data_source must ONLY ever be one of their allowed values
   above, or "".
4. Keep every value a single line — replace internal newlines with a space
   or "\\n" escape, never a literal line break.
5. Return exactly one output object per input row, in the same order.
`.trim();

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    records: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          created_at: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          email: { type: SchemaType.STRING },
          country_code: { type: SchemaType.STRING },
          mobile_without_country_code: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          city: { type: SchemaType.STRING },
          state: { type: SchemaType.STRING },
          country: { type: SchemaType.STRING },
          lead_owner: { type: SchemaType.STRING },
          crm_status: { type: SchemaType.STRING },
          crm_note: { type: SchemaType.STRING },
          data_source: { type: SchemaType.STRING },
          possession_time: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: [
          "created_at",
          "name",
          "email",
          "country_code",
          "mobile_without_country_code",
          "company",
          "city",
          "state",
          "country",
          "lead_owner",
          "crm_status",
          "crm_note",
          "data_source",
          "possession_time",
          "description",
        ],
      },
    },
  },
  required: ["records"],
};

export class GeminiExtractionError extends Error {}

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiExtractionError(
        "GEMINI_API_KEY is not set. Add it to backend/.env."
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends one batch of raw CSV rows to Gemini and returns the raw candidate
 * objects it produced, in the same order as the input rows. Retries with
 * exponential backoff on transient failures (rate limits, malformed JSON).
 */
export async function extractBatchWithGemini(
  rows: RawCsvRow[]
): Promise<Record<string, unknown>[]> {
  const model = getClient().getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as never,
      temperature: 0.1,
    },
  });

  const prompt = `Map these ${rows.length} raw CSV rows to the GrowEasy CRM schema. Input rows (JSON array, in order):\n${JSON.stringify(
    rows
  )}`;

  let lastError: unknown;

  for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as { records?: unknown[] };

      if (!Array.isArray(parsed.records)) {
        throw new GeminiExtractionError(
          "AI response did not include a 'records' array."
        );
      }

      if (parsed.records.length !== rows.length) {
        throw new GeminiExtractionError(
          `AI returned ${parsed.records.length} records for ${rows.length} input rows.`
        );
      }

      return parsed.records as Record<string, unknown>[];
    } catch (err) {
      lastError = err;
      if (attempt < AI_MAX_RETRIES) {
        await sleep(300 * 2 ** (attempt - 1)); // 300ms, 600ms, 1200ms...
      }
    }
  }

  throw new GeminiExtractionError(
    `Gemini extraction failed after ${AI_MAX_RETRIES} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
