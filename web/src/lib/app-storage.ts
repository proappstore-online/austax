import type { ReturnDraft } from "../components/DraftWizard";
import { isAvailableIncomeYear } from "./income-year";

export type Deduction = {
  title: string;
  note: string;
  amount: number;
  icon: "receipt" | "file";
  done: boolean;
};

export const starterDeductions: Deduction[] = [
  {
    title: "Work from home",
    note: "Hours worked and expenses",
    amount: 0,
    icon: "receipt",
    done: false,
  },
  {
    title: "Work-related expenses",
    note: "Tools, travel, education and more",
    amount: 0,
    icon: "receipt",
    done: false,
  },
  {
    title: "Donations",
    note: "Gifts to registered charities",
    amount: 0,
    icon: "file",
    done: false,
  },
];

export type StoredPreparation = {
  draft: ReturnDraft | null;
  deductions: Deduction[];
  documents: string[];
};

export type ThemePreference = "system" | "light" | "dark";
export type TextSizePreference = "small" | "default" | "large";
export type Preferences = {
  theme: ThemePreference;
  textSize: TextSizePreference;
};

export const preparationStorageKey = "austax-preparation-v1";
export const preferencesStorageKey = "austax-preferences-v1";

export function loadPreparation(): StoredPreparation {
  try {
    const saved = sessionStorage.getItem(preparationStorageKey);
    if (!saved) {
      return { draft: null, deductions: starterDeductions, documents: [] };
    }
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") {
      return { draft: null, deductions: starterDeductions, documents: [] };
    }
    const value = parsed as Partial<StoredPreparation>;
    const draft = isReturnDraft(value.draft) ? value.draft : null;
    const deductions = Array.isArray(value.deductions)
      ? value.deductions.filter(isDeduction)
      : starterDeductions;
    const documents = Array.isArray(value.documents)
      ? value.documents.filter((item): item is string => typeof item === "string")
      : [];
    return {
      draft,
      deductions,
      documents,
    };
  } catch {
    return { draft: null, deductions: starterDeductions, documents: [] };
  }
}

function isDeduction(value: unknown): value is Deduction {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Deduction>;
  return (
    typeof item.title === "string" &&
    typeof item.note === "string" &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    (item.icon === "receipt" || item.icon === "file") &&
    typeof item.done === "boolean"
  );
}

function isReturnDraft(value: unknown): value is ReturnDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<ReturnDraft>;
  return (
    (draft.incomeYear === undefined || isAvailableIncomeYear(draft.incomeYear)) &&
    typeof draft.residency === "string" &&
    Array.isArray(draft.income) &&
    draft.income.every((item) => typeof item === "string") &&
    Array.isArray(draft.deductions) &&
    draft.deductions.every((item) => typeof item === "string") &&
    Array.isArray(draft.considerations) &&
    draft.considerations.every((item) => typeof item === "string") &&
    typeof draft.recordStatus === "string"
  );
}

export function loadPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(preferencesStorageKey);
    if (!saved) return { theme: "system", textSize: "default" };
    const parsed = JSON.parse(saved) as Partial<Preferences>;
    return {
      theme: ["system", "light", "dark"].includes(parsed.theme ?? "")
        ? (parsed.theme as ThemePreference)
        : "system",
      textSize: ["small", "default", "large"].includes(
        parsed.textSize ?? "",
      )
        ? (parsed.textSize as TextSizePreference)
        : "default",
    };
  } catch {
    return { theme: "system", textSize: "default" };
  }
}
