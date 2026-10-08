export type IncomeYear = `${number}-${number}`;

export type TaxBracket = {
  lowerBound: number;
  upperBound: number | null;
  rate: number;
};

export const incomeYearRates: Record<string, TaxBracket[]> = {
  "2023-24": [
    { lowerBound: 0, upperBound: 18_200, rate: 0 },
    { lowerBound: 18_200, upperBound: 45_000, rate: 19 },
    { lowerBound: 45_000, upperBound: 120_000, rate: 32.5 },
    { lowerBound: 120_000, upperBound: 180_000, rate: 37 },
    { lowerBound: 180_000, upperBound: null, rate: 45 },
  ],
  "2024-25": [
    { lowerBound: 0, upperBound: 18_200, rate: 0 },
    { lowerBound: 18_200, upperBound: 45_000, rate: 16 },
    { lowerBound: 45_000, upperBound: 135_000, rate: 30 },
    { lowerBound: 135_000, upperBound: 190_000, rate: 37 },
    { lowerBound: 190_000, upperBound: null, rate: 45 },
  ],
  "2025-26": [
    { lowerBound: 0, upperBound: 18_200, rate: 0 },
    { lowerBound: 18_200, upperBound: 45_000, rate: 16 },
    { lowerBound: 45_000, upperBound: 135_000, rate: 30 },
    { lowerBound: 135_000, upperBound: 190_000, rate: 37 },
    { lowerBound: 190_000, upperBound: null, rate: 45 },
  ],
  "2026-27": [
    { lowerBound: 0, upperBound: 18_200, rate: 0 },
    { lowerBound: 18_200, upperBound: 45_000, rate: 15 },
    { lowerBound: 45_000, upperBound: 135_000, rate: 30 },
    { lowerBound: 135_000, upperBound: 190_000, rate: 37 },
    { lowerBound: 190_000, upperBound: null, rate: 45 },
  ],
};

export function getCurrentIncomeYear(date = new Date()): string {
  const startYear = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function getAvailableIncomeYears(date = new Date()): string[] {
  const currentYear = Number(getCurrentIncomeYear(date).slice(0, 4));
  return Array.from({ length: Math.max(0, currentYear - 2023 + 1) }, (_, index) => {
    const start = 2023 + index;
    return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
  });
}

export function isAvailableIncomeYear(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return Boolean(match && Number(match[2]) === (Number(match[1]) + 1) % 100);
}

export function getIncomeYearLabel(year: string): string {
  const [start, end] = year.split("-");
  return `${start}–${end}`;
}

export function getDraftIncomeYear(
  draft: { incomeYear?: string } | null | undefined,
  fallbackYear: string,
): string | undefined {
  return draft ? draft.incomeYear : fallbackYear;
}
