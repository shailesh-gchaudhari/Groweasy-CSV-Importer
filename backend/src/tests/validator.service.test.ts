import assert from "node:assert/strict";
import { test } from "node:test";
import { validateExtractedRecord } from "../services/validator.service";

test("valid record with email passes and normalizes fields", () => {
  const outcome = validateExtractedRecord(
    {
      name: "John Doe",
      email: "john@example.com",
      mobile_without_country_code: "",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
      data_source: "leads_on_demand",
      created_at: "2026-05-13 14:20:48",
    },
    {}
  );
  assert.equal(outcome.valid, true);
  assert.equal(outcome.record?.crm_status, "GOOD_LEAD_FOLLOW_UP");
  assert.equal(outcome.record?.data_source, "leads_on_demand");
});

test("record with no email and no mobile is skipped", () => {
  const outcome = validateExtractedRecord(
    { name: "No Contact", email: "", mobile_without_country_code: "" },
    {}
  );
  assert.equal(outcome.valid, false);
  assert.match(outcome.reason ?? "", /neither an email/i);
});

test("invalid crm_status enum is blanked instead of rejected", () => {
  const outcome = validateExtractedRecord(
    {
      name: "Jane",
      email: "jane@example.com",
      crm_status: "NOT_A_REAL_STATUS",
    },
    {}
  );
  assert.equal(outcome.valid, true);
  assert.equal(outcome.record?.crm_status, "");
});

test("invalid data_source enum is blanked instead of rejected", () => {
  const outcome = validateExtractedRecord(
    {
      name: "Jane",
      email: "jane@example.com",
      data_source: "random_project",
    },
    {}
  );
  assert.equal(outcome.valid, true);
  assert.equal(outcome.record?.data_source, "");
});

test("unparseable created_at is blanked, not fabricated", () => {
  const outcome = validateExtractedRecord(
    {
      name: "Jane",
      email: "jane@example.com",
      created_at: "not-a-real-date-string!!",
    },
    {}
  );
  assert.equal(outcome.valid, true);
  assert.equal(outcome.record?.created_at, "");
});

test("mobile-only record (no email) is still valid", () => {
  const outcome = validateExtractedRecord(
    { name: "Mobile Only", email: "", mobile_without_country_code: "9876543210" },
    {}
  );
  assert.equal(outcome.valid, true);
});
