import { describe, it, expect, vi, beforeEach } from "vitest";

const call = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/app", () => ({ app: { actions: { call } } }));

import { draftFromRow, savePreparationDraft } from "../src/lib/preparation-actions";

const flagFields = [
  "income_salary_wages",
  "income_bank_interest",
  "income_dividends",
  "income_rental",
  "income_sole_trader",
  "income_shares_crypto",
  "income_foreign",
  "income_government_payments",
  "deduction_work_from_home",
  "deduction_work_related",
  "deduction_work_travel",
  "deduction_self_education",
  "deduction_donations",
  "deduction_tax_affairs",
  "consideration_private_health",
  "consideration_help_loan",
  "consideration_rental_property",
  "consideration_investments",
  "consideration_foreign_residency",
  "consideration_business_income",
] as const;

const savable = {
  incomeYear: "2025-26",
  residency: "Yes",
  income: [],
  deductions: [],
  considerations: [],
  recordStatus: "Not sure",
};

describe("preparation draft save payload", () => {
  beforeEach(() => {
    call.mockReset();
    call.mockResolvedValue({ meta: { changes: 1 } });
  });

  it("maps every selected checklist label to its stored flag", async () => {
    await savePreparationDraft("draft-1", {
      incomeYear: "2025-26",
      residency: "Yes",
      income: ["Salary or wages", "Sole trader or gig work", "Government payments"],
      deductions: ["Work from home", "Cost of managing tax affairs"],
      considerations: ["HELP / study loan", "Sole trader or business income"],
      recordStatus: "Some to find",
    });

    expect(call).toHaveBeenCalledTimes(1);
    const [name, params] = call.mock.calls[0];
    expect(name).toBe("save_preparation_draft");
    expect(params).toEqual({
      draft_id: "draft-1",
      income_year: "2025-26",
      residency: "Yes",
      record_status: "Some to find",
      income_salary_wages: true,
      income_bank_interest: false,
      income_dividends: false,
      income_rental: false,
      income_sole_trader: true,
      income_shares_crypto: false,
      income_foreign: false,
      income_government_payments: true,
      deduction_work_from_home: true,
      deduction_work_related: false,
      deduction_work_travel: false,
      deduction_self_education: false,
      deduction_donations: false,
      deduction_tax_affairs: true,
      consideration_private_health: false,
      consideration_help_loan: true,
      consideration_rental_property: false,
      consideration_investments: false,
      consideration_foreign_residency: false,
      consideration_business_income: true,
    });
    expect(Object.keys(params).sort()).toEqual(
      ["draft_id", "income_year", "residency", "record_status", ...flagFields].sort(),
    );
  });

  it("refuses to save a draft without an income year", async () => {
    await expect(
      savePreparationDraft("draft-2", {
        residency: "No",
        income: [],
        deductions: [],
        considerations: [],
        recordStatus: "Not sure",
      }),
    ).rejects.toThrow("A preparation draft needs an income year");
    expect(call).not.toHaveBeenCalled();
  });

  it("rejects when the guarded insert writes no row", async () => {
    call.mockResolvedValue({ meta: { changes: 0 } });
    await expect(savePreparationDraft("draft-4", savable)).rejects.toThrow(
      "The preparation draft was not saved",
    );
  });

  it("rejects when the action reports no change count", async () => {
    call.mockResolvedValue({});
    await expect(savePreparationDraft("draft-5", savable)).rejects.toThrow(
      "The preparation draft was not saved",
    );
  });

  it("accepts a per-statement result shape", async () => {
    call.mockResolvedValue({ results: [{ meta: { changes: 1 } }] });
    await expect(savePreparationDraft("draft-6", savable)).resolves.toBeUndefined();
  });

  it("round-trips a stored row back to the same checklist labels", async () => {
    const unselected = Object.fromEntries(flagFields.map((field) => [field, 0]));
    const row = {
      id: "draft-3",
      income_year: "2024-25",
      residency: "Not sure",
      record_status: "Ready to review",
      ...unselected,
      income_salary_wages: 1,
      income_foreign: 1,
      deduction_donations: 1,
      consideration_foreign_residency: 1,
    };

    expect(draftFromRow(row)).toEqual({
      incomeYear: "2024-25",
      residency: "Not sure",
      income: ["Salary or wages", "Foreign income"],
      deductions: ["Donations"],
      considerations: ["Foreign income or overseas residency"],
      recordStatus: "Ready to review",
    });
  });
});
