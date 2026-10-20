import type { ReturnDraft } from "../components/DraftWizard";
import { app } from "./app";
import { considerationFlags, deductionFlags, incomeFlags } from "./draft-options";

type FlagField =
  | (typeof incomeFlags)[number][1]
  | (typeof deductionFlags)[number][1]
  | (typeof considerationFlags)[number][1];

type DraftRow = {
  id: string;
  income_year: string;
  residency: string;
  record_status: string;
} & Record<FlagField, number | boolean>;

const selected = (value: number | boolean) => value === true || value === 1;
const valuesFor = (flags: readonly (readonly [string, FlagField])[], row: DraftRow) =>
  flags.filter(([, field]) => selected(row[field])).map(([label]) => label);

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

const flagValues = (flags: readonly (readonly [string, FlagField])[], chosen: string[]) =>
  Object.fromEntries(flags.map(([label, field]) => [field, chosen.includes(label)]));

export async function savePreparationDraft(id: string, draft: ReturnDraft): Promise<void> {
  if (!draft.incomeYear) throw new Error("A preparation draft needs an income year");
  await app.actions.call("save_preparation_draft", {
    draft_id: id,
    income_year: draft.incomeYear,
    residency: draft.residency,
    record_status: draft.recordStatus,
    ...flagValues(incomeFlags, draft.income),
    ...flagValues(deductionFlags, draft.deductions),
    ...flagValues(considerationFlags, draft.considerations),
  });
}
