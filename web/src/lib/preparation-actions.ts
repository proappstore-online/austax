import type { ReturnDraft } from "../components/DraftWizard";
import { app } from "./app";

type DraftRow = {
  id: string;
  income_year: string;
  residency: string;
  income_salary_wages: number | boolean;
  income_bank_interest: number | boolean;
  income_dividends: number | boolean;
  income_rental: number | boolean;
  income_sole_trader: number | boolean;
  income_shares_crypto: number | boolean;
  income_foreign: number | boolean;
  income_government_payments: number | boolean;
  deduction_work_from_home: number | boolean;
  deduction_work_related: number | boolean;
  deduction_work_travel: number | boolean;
  deduction_self_education: number | boolean;
  deduction_donations: number | boolean;
  deduction_tax_affairs: number | boolean;
  consideration_private_health: number | boolean;
  consideration_help_loan: number | boolean;
  consideration_rental_property: number | boolean;
  consideration_investments: number | boolean;
  consideration_foreign_residency: number | boolean;
  consideration_business_income: number | boolean;
  record_status: string;
};

const incomeFlags = [
  ["Salary or wages", "income_salary_wages"],
  ["Bank interest", "income_bank_interest"],
  ["Dividends or managed funds", "income_dividends"],
  ["Rental income", "income_rental"],
  ["Sole trader or gig work", "income_sole_trader"],
  ["Shares or crypto sold", "income_shares_crypto"],
  ["Foreign income", "income_foreign"],
  ["Government payments", "income_government_payments"],
] as const;
const deductionFlags = [
  ["Work from home", "deduction_work_from_home"],
  ["Work-related tools or equipment", "deduction_work_related"],
  ["Work travel or vehicle use", "deduction_work_travel"],
  ["Self-education", "deduction_self_education"],
  ["Donations", "deduction_donations"],
  ["Cost of managing tax affairs", "deduction_tax_affairs"],
] as const;
const considerationFlags = [
  ["Private health insurance", "consideration_private_health"],
  ["HELP / study loan", "consideration_help_loan"],
  ["Rental property", "consideration_rental_property"],
  ["Shares, crypto or other investments", "consideration_investments"],
  ["Foreign income or overseas residency", "consideration_foreign_residency"],
  ["Sole trader or business income", "consideration_business_income"],
] as const;

const selected = (value: number | boolean) => value === true || value === 1;
const valuesFor = (flags: readonly (readonly [string, keyof DraftRow])[], row: DraftRow) =>
  flags.filter(([, field]) => selected(row[field] as number | boolean)).map(([label]) => label);

export function draftFromRow(row: DraftRow): ReturnDraft {
  return {
    incomeYear: row.income_year,
    residency: row.residency,
    income: valuesFor(incomeFlags, row),
    deductions: valuesFor(deductionFlags, row),
    considerations: valuesFor(considerationFlags, row),
    recordStatus: row.record_status,
  };
}

export async function loadLatestPreparationDraft(): Promise<{ id: string; draft: ReturnDraft } | null> {
  const response = await app.actions.call<{ rows: DraftRow[] }>("list_preparation_drafts", { limit: 1 });
  const row = response.rows[0];
  return row ? { id: row.id, draft: draftFromRow(row) } : null;
}

export async function savePreparationDraft(id: string, draft: ReturnDraft): Promise<void> {
  if (!draft.incomeYear) throw new Error("A preparation draft needs an income year");
  const includes = (items: string[], label: string) => items.includes(label);
  await app.actions.call("save_preparation_draft", {
    draft_id: id,
    income_year: draft.incomeYear,
    residency: draft.residency,
    income_salary_wages: includes(draft.income, "Salary or wages"),
    income_bank_interest: includes(draft.income, "Bank interest"),
    income_dividends: includes(draft.income, "Dividends or managed funds"),
    income_rental: includes(draft.income, "Rental income"),
    income_sole_trader: includes(draft.income, "Sole trader or gig work"),
    income_shares_crypto: includes(draft.income, "Shares or crypto sold"),
    income_foreign: includes(draft.income, "Foreign income"),
    income_government_payments: includes(draft.income, "Government payments"),
    deduction_work_from_home: includes(draft.deductions, "Work from home"),
    deduction_work_related: includes(draft.deductions, "Work-related tools or equipment"),
    deduction_work_travel: includes(draft.deductions, "Work travel or vehicle use"),
    deduction_self_education: includes(draft.deductions, "Self-education"),
    deduction_donations: includes(draft.deductions, "Donations"),
    deduction_tax_affairs: includes(draft.deductions, "Cost of managing tax affairs"),
    consideration_private_health: includes(draft.considerations, "Private health insurance"),
    consideration_help_loan: includes(draft.considerations, "HELP / study loan"),
    consideration_rental_property: includes(draft.considerations, "Rental property"),
    consideration_investments: includes(draft.considerations, "Shares, crypto or other investments"),
    consideration_foreign_residency: includes(draft.considerations, "Foreign income or overseas residency"),
    consideration_business_income: includes(draft.considerations, "Sole trader or business income"),
    record_status: draft.recordStatus,
  });
}
