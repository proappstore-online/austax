import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentIncomeYear,
  getDraftIncomeYear,
  getIncomeYearLabel,
  incomeYearRates,
} from "../src/lib/income-year.ts";

test("current Australian income year rolls over on 1 July", () => {
  assert.equal(getCurrentIncomeYear(new Date(2026, 5, 30, 23, 59)), "2025-26");
  assert.equal(getCurrentIncomeYear(new Date(2026, 6, 1)), "2026-27");
});

test("a saved draft keeps its year across rollover and an unassigned draft stays unassigned", () => {
  const savedDraft = { incomeYear: "2025-26", residency: "Yes" };
  const nextYear = getCurrentIncomeYear(new Date(2026, 6, 1));
  assert.equal(nextYear, "2026-27");
  assert.equal(getDraftIncomeYear(savedDraft, nextYear), "2025-26");
  assert.equal(getDraftIncomeYear({ residency: "Yes" }, nextYear), undefined);
  assert.equal(getDraftIncomeYear(null, nextYear), "2026-27");
});

test("labels and bracket guidance are scoped to the selected year", () => {
  assert.equal(getIncomeYearLabel("2026-27"), "2026–27");
  assert.equal(incomeYearRates["2023-24"][1].rate, 19);
  assert.equal(incomeYearRates["2024-25"][1].rate, 16);
  assert.equal(incomeYearRates["2025-26"][1].rate, 16);
  assert.equal(incomeYearRates["2026-27"][1].rate, 15);
});
