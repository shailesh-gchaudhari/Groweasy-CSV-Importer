import {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CrmRecord,
  RawCsvRow,
} from "../types/crm";

const CRM_STATUS_SET = new Set<string>(CRM_STATUS_VALUES);
const DATA_SOURCE_SET = new Set<string>(DATA_SOURCE_VALUES);

export interface ValidationOutcome {
  valid: boolean;
  reason?: string;
  record?: CrmRecord;
}

const asString = (v: unknown): string =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

/**
 * Applies the assignment's post-extraction business rules to a single
 * AI-produced candidate record:
 *  - crm_status / data_source must be one of the allowed enums, else blank
 *  - created_at must be parseable by `new Date(...)`
 *  - a record with neither email nor mobile is invalid (must be skipped)
 */
export function validateExtractedRecord(
  candidate: Record<string, unknown>,
  _originalRow: RawCsvRow
): ValidationOutcome {
  const email = asString(candidate.email);
  const mobile = asString(candidate.mobile_without_country_code);

  if (!email && !mobile) {
    return {
      valid: false,
      reason: "Record has neither an email address nor a mobile number.",
    };
  }

  let crmStatus = asString(candidate.crm_status);
  if (!CRM_STATUS_SET.has(crmStatus)) {
    crmStatus = "";
  }

  let dataSource = asString(candidate.data_source);
  if (!DATA_SOURCE_SET.has(dataSource)) {
    dataSource = "";
  }

  let createdAt = asString(candidate.created_at);
  if (createdAt && Number.isNaN(new Date(createdAt).getTime())) {
    // Unparseable date: fall back to the raw value found anywhere in the
    // original row that looks date-like, otherwise leave blank rather than
    // fabricate a date.
    createdAt = "";
  }

  const record: CrmRecord = {
    created_at: createdAt,
    name: asString(candidate.name),
    email,
    country_code: asString(candidate.country_code),
    mobile_without_country_code: mobile,
    company: asString(candidate.company),
    city: asString(candidate.city),
    state: asString(candidate.state),
    country: asString(candidate.country),
    lead_owner: asString(candidate.lead_owner),
    crm_status: crmStatus as CrmRecord["crm_status"],
    crm_note: asString(candidate.crm_note),
    data_source: dataSource as CrmRecord["data_source"],
    possession_time: asString(candidate.possession_time),
    description: asString(candidate.description),
  };

  return { valid: true, record };
}
