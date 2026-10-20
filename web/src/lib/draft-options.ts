/**
 * Checklist choices shared by the draft wizard and the preparation store.
 * Each label is paired with the stored column it saves to.
 */
export const incomeFlags = [
  ["Salary or wages", "income_salary_wages"],
  ["Bank interest", "income_bank_interest"],
  ["Dividends or managed funds", "income_dividends"],
  ["Rental income", "income_rental"],
  ["Sole trader or gig work", "income_sole_trader"],
  ["Shares or crypto sold", "income_shares_crypto"],
  ["Foreign income", "income_foreign"],
  ["Government payments", "income_government_payments"],
] as const;

export const deductionFlags = [
  ["Work from home", "deduction_work_from_home"],
  ["Work-related tools or equipment", "deduction_work_related"],
  ["Work travel or vehicle use", "deduction_work_travel"],
  ["Self-education", "deduction_self_education"],
  ["Donations", "deduction_donations"],
  ["Cost of managing tax affairs", "deduction_tax_affairs"],
] as const;

export const considerationFlags = [
  ["Private health insurance", "consideration_private_health"],
  ["HELP / study loan", "consideration_help_loan"],
  ["Rental property", "consideration_rental_property"],
  ["Shares, crypto or other investments", "consideration_investments"],
  ["Foreign income or overseas residency", "consideration_foreign_residency"],
  ["Sole trader or business income", "consideration_business_income"],
] as const;

export const incomeOptions = incomeFlags.map(([label]) => label);
export const deductionOptions = deductionFlags.map(([label]) => label);
export const considerationOptions = considerationFlags.map(([label]) => label);
