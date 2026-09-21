import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  LockKeyhole,
  X,
} from "lucide-react";

export type ReturnDraft = {
  residency: string;
  income: string[];
  deductions: string[];
  considerations: string[];
  recordStatus: string;
};

type Props = {
  initial?: ReturnDraft;
  onSave: (draft: ReturnDraft) => void;
  onClose: () => void;
};

const incomeOptions = [
  "Salary or wages",
  "Bank interest",
  "Dividends or managed funds",
  "Rental income",
  "Sole trader or gig work",
  "Shares or crypto sold",
  "Foreign income",
  "Government payments",
];
const deductionOptions = [
  "Work from home",
  "Work-related tools or equipment",
  "Work travel or vehicle use",
  "Self-education",
  "Donations",
  "Cost of managing tax affairs",
];
const considerationOptions = [
  "Private health insurance",
  "HELP / study loan",
  "Rental property",
  "Shares, crypto or other investments",
  "Foreign income or overseas residency",
  "Sole trader or business income",
];

function ToggleList({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="wizard-options">
      {options.map((item) => {
        const checked = selected.includes(item);
        return (
          <button
            type="button"
            key={item}
            className={`wizard-option ${checked ? "selected" : ""}`}
            onClick={() =>
              onChange(
                checked
                  ? selected.filter((value) => value !== item)
                  : [...selected, item],
              )
            }
          >
            <span className="option-check">
              {checked && <Check size={14} />}
            </span>
            {item}
          </button>
        );
      })}
    </div>
  );
}

export function DraftWizard({ initial, onSave, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReturnDraft>(
    initial ?? {
      residency: "",
      income: [],
      deductions: [],
      considerations: [],
      recordStatus: "",
    },
  );
  const title = [
    "Before we begin",
    "Your income",
    "Deductions to review",
    "A few important checks",
    "Your preparation draft",
  ][step];
  const complete = useMemo(
    () => Boolean(draft.residency && draft.income.length && draft.recordStatus),
    [draft],
  );

  return (
    <div
      className="wizard-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-title"
    >
      <section className="wizard">
        <header className="wizard-head">
          <div>
            <p className="eyebrow">AUSTAX PREPARATION DRAFT</p>
            <h2 id="draft-title">{title}</h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close draft"
          >
            <X size={18} />
          </button>
        </header>
        <div className="wizard-progress">
          <i style={{ width: `${(step + 1) * 20}%` }} />
          <span>Step {step + 1} of 5</span>
        </div>

        {step === 0 && (
          <div className="wizard-body">
            <p>
              This creates a checklist for your official ATO return. Do not
              enter a TFN, myGov password, bank login, or identity-document
              number here.
            </p>
            <fieldset>
              <legend>
                For the 2025–26 income year, were you an Australian resident for
                tax purposes?
              </legend>
              <div className="choice-row">
                {["Yes", "No", "Not sure"].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={draft.residency === value ? "selected" : ""}
                    onClick={() => setDraft({ ...draft, residency: value })}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
            {draft.residency === "Not sure" && (
              <div className="wizard-note">
                <CircleHelp size={16} />
                Residency can change what you need to report. Keep this flagged
                for the ATO or a registered tax agent.
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="wizard-body">
            <p>
              Select every type of income you received, even if you think it was
              already reported elsewhere. You will review the official amounts
              in myTax later.
            </p>
            <ToggleList
              options={incomeOptions}
              selected={draft.income}
              onChange={(income) => setDraft({ ...draft, income })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body">
            <p>
              Choose the areas you want to check. This is not a claim
              decision—keep receipts and confirm each item against the ATO
              rules.
            </p>
            <ToggleList
              options={deductionOptions}
              selected={draft.deductions}
              onChange={(deductions) => setDraft({ ...draft, deductions })}
            />
            <fieldset>
              <legend>How are your supporting records?</legend>
              <div className="choice-row compact">
                {["Ready to review", "Some to find", "Not sure"].map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      className={draft.recordStatus === value ? "selected" : ""}
                      onClick={() =>
                        setDraft({ ...draft, recordStatus: value })
                      }
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-body">
            <p>
              These situations often need extra information or a closer review.
              Select anything that applies.
            </p>
            <ToggleList
              options={considerationOptions}
              selected={draft.considerations}
              onChange={(considerations) =>
                setDraft({ ...draft, considerations })
              }
            />
            {draft.considerations.length > 0 && (
              <div className="wizard-warning">
                <AlertTriangle size={16} />
                We’ll flag these for official guidance or a registered tax
                agent. AusTax won’t determine your treatment.
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="wizard-body summary-body">
            <p>
              Your first preparation draft is ready to save. It is not an ATO
              tax return and it will not lodge anything.
            </p>
            <div className="draft-summary">
              <span>Residency</span>
              <b>{draft.residency || "Needs review"}</b>
              <span>Income areas</span>
              <b>
                {draft.income.length
                  ? draft.income.join(", ")
                  : "None selected"}
              </b>
              <span>Deductions to review</span>
              <b>
                {draft.deductions.length
                  ? draft.deductions.join(", ")
                  : "None selected"}
              </b>
              <span>Extra review flags</span>
              <b>
                {draft.considerations.length
                  ? draft.considerations.join(", ")
                  : "None selected"}
              </b>
              <span>Records</span>
              <b>{draft.recordStatus || "Needs review"}</b>
            </div>
            <div className="wizard-note">
              <LockKeyhole size={16} />
              Before lodging, check every amount and pre-filled item in myTax.
              General information only—not tax advice.
            </div>
          </div>
        )}

        <footer className="wizard-footer">
          <button
            className="wizard-back"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft size={16} /> Back
              </>
            )}
          </button>
          {step < 4 ? (
            <button
              className="wizard-next"
              disabled={
                (step === 0 && !draft.residency) ||
                (step === 1 && !draft.income.length) ||
                (step === 2 && !draft.recordStatus)
              }
              onClick={() => setStep(step + 1)}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="wizard-next"
              disabled={!complete}
              onClick={() => onSave(draft)}
            >
              Save for this session <Check size={16} />
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
