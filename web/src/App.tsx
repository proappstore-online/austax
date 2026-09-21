import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  FolderUp,
  Home,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Monitor,
  Moon,
  Plus,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Type,
  X,
} from "lucide-react";
import { askAusTaxGuide } from "./lib/pags";
import { DraftWizard, type ReturnDraft } from "./components/DraftWizard";

type Deduction = {
  title: string;
  note: string;
  amount: number;
  icon: "receipt" | "file";
  done: boolean;
};

const starterDeductions: Deduction[] = [
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

type StoredPreparation = {
  draft: ReturnDraft | null;
  deductions: Deduction[];
  documents: string[];
};

type ThemePreference = "system" | "light" | "dark";
type TextSizePreference = "small" | "default" | "large";
type Preferences = {
  theme: ThemePreference;
  textSize: TextSizePreference;
};

const preparationStorageKey = "austax-preparation-v1";
const preferencesStorageKey = "austax-preferences-v1";

function loadPreparation(): StoredPreparation {
  try {
    const saved = sessionStorage.getItem(preparationStorageKey);
    if (!saved) {
      return { draft: null, deductions: starterDeductions, documents: [] };
    }
    const parsed = JSON.parse(saved) as Partial<StoredPreparation>;
    return {
      draft: parsed.draft ?? null,
      deductions: Array.isArray(parsed.deductions)
        ? parsed.deductions
        : starterDeductions,
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    };
  } catch {
    return { draft: null, deductions: starterDeductions, documents: [] };
  }
}

function loadPreferences(): Preferences {
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

const format = (amount: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function App() {
  const [savedPreparation] = useState(loadPreparation);
  const [active, setActive] = useState("Overview");
  const [deductions, setDeductions] = useState(savedPreparation.deductions);
  const [documents, setDocuments] = useState<string[]>(
    savedPreparation.documents,
  );
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState<ReturnDraft | null>(
    savedPreparation.draft,
  );
  const [draftStep, setDraftStep] = useState(0);
  const [documentMessage, setDocumentMessage] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(loadPreferences);
  const fileInput = useRef<HTMLInputElement>(null);
  const totalDeductions = useMemo(
    () => deductions.reduce((total, item) => total + item.amount, 0),
    [deductions],
  );
  const completeCount = deductions.filter((item) => item.done).length;

  useEffect(() => {
    sessionStorage.setItem(
      preparationStorageKey,
      JSON.stringify({ draft, deductions, documents }),
    );
  }, [deductions, documents, draft]);

  useEffect(() => {
    const resolvedTheme =
      preferences.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : preferences.theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.textSize = preferences.textSize;
    localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences));
  }, [preferences]);

  async function askAssistant() {
    const cleaned = question.trim();
    if (!cleaned || isAsking) return;
    setIsAsking(true);
    setReply("Checking the AusTax Guide…");
    setQuestion("");
    try {
      const result = await askAusTaxGuide(cleaned);
      setReply(result.reply);
    } catch {
      setReply(
        "I can help organise what you need to check, but I can’t decide eligibility, calculate a final outcome, or lodge a return. Check the official ATO guidance or speak with a registered tax agent before lodging.",
      );
    } finally {
      setIsAsking(false);
    }
  }

  function openDraft(step = 0) {
    setDraftStep(step);
    setShowDraft(true);
  }

  function openSection(label: (typeof navItems)[number][0]) {
    setActive(label);
    setShowMenu(false);
    if (label === "Income") return openDraft(1);
    if (label === "Deductions") return openDraft(2);
    if (label === "Documents") {
      requestAnimationFrame(() =>
        document.getElementById("documents")?.scrollIntoView({ behavior: "smooth" }),
      );
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addDeduction(title: string) {
    setDeductions((items) => [
      ...items,
      {
        title,
        note: "Add details and supporting records",
        amount: 0,
        icon: "receipt",
        done: false,
      },
    ]);
    setShowNew(false);
  }

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    const accepted = selected.filter(
      (file) =>
        /\.(pdf|jpe?g|png)$/i.test(file.name) && file.size <= 10 * 1024 * 1024,
    );
    const rejected = selected.length - accepted.length;
    setDocuments((items) => [...new Set([...items, ...accepted.map((file) => file.name)])]);
    setDocumentMessage(
      rejected
        ? `${rejected} file${rejected === 1 ? " was" : "s were"} not added. Use PDF, JPG or PNG files up to 10MB.`
        : `${accepted.length} file${accepted.length === 1 ? "" : "s"} added for this browser session. Files are not uploaded.`,
    );
  }

  function saveDraft(nextDraft: ReturnDraft) {
    setDraft(nextDraft);
    setShowDraft(false);
    setActive("Overview");
  }

  const navItems = [
    ["Overview", Home],
    ["Income", FileText],
    ["Deductions", ReceiptText],
    ["Documents", FolderUp],
  ] as const;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => openSection("Overview")}>
          <span className="brand-mark">a</span>
          <span>AusTax</span>
        </a>
        <div className="year-pill">
          2025–26 return <ChevronRight size={14} />
        </div>
        <div className="top-actions">
          <button
            className="help-button"
            onClick={() =>
              document
                .getElementById("assistant")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <CircleHelp size={18} />
            <span>Help</span>
          </button>
          <button
            className="avatar"
            aria-label="Open profile and preferences"
            onClick={() => setShowPreferences(true)}
          >
            AS
          </button>
        </div>
      </header>

      <aside className={`sidebar ${showMenu ? "is-open" : ""}`}>
        <button
          className="close-menu"
          onClick={() => setShowMenu(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <nav>
          <p className="nav-label">YOUR RETURN</p>
          {navItems.map(([label, Icon]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => openSection(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Documents" && documents.length > 1 && (
                <em>{documents.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-note">
            <ShieldCheck size={17} />
            <span>
              Never enter your TFN,
              <br />
              myGov password or bank login.
            </span>
          </div>
          <a
            className="tax-agent"
            href="https://www.tpb.gov.au/public-register"
            target="_blank"
            rel="noreferrer"
          >
            Need a tax agent? <ArrowUpRight size={14} />
          </a>
        </div>
      </aside>
      {showMenu && (
        <button
          className="menu-backdrop"
          onClick={() => setShowMenu(false)}
          aria-label="Close menu"
        />
      )}

      <main id="top">
        <button className="mobile-menu" onClick={() => setShowMenu(true)}>
          <Menu size={20} /> Menu
        </button>
        <section className="welcome-row">
          <div>
            <p className="eyebrow">INDIVIDUAL TAX RETURN</p>
            <h1>Prepare your return with confidence.</h1>
            <p className="subhead">
              Let’s get your return ready. You’re making great progress.
            </p>
          </div>
          <button className="start-draft" onClick={() => openDraft()}>
            {draft ? (
              <>
                <Check size={16} /> Review your draft
              </>
            ) : (
              <>
                Start your draft <ArrowUpRight size={16} />
              </>
            )}
          </button>
        </section>

        {draft && (
          <section className="draft-banner">
            <div>
              <p className="eyebrow">SESSION PREPARATION DRAFT</p>
              <h2>Your checklist is ready for review</h2>
              <p>
                {draft.income.length} income area
                {draft.income.length === 1 ? "" : "s"} ·{" "}
                {draft.deductions.length} deduction area
                {draft.deductions.length === 1 ? "" : "s"} ·{" "}
                {draft.considerations.length} extra review flag
                {draft.considerations.length === 1 ? "" : "s"}
              </p>
            </div>
            <button className="link-button" onClick={() => openDraft()}>
              Open draft <ChevronRight size={16} />
            </button>
          </section>
        )}

        <section className="summary-grid">
          <article className="estimate-card">
            <div className="card-caption">
              PREPARATION SNAPSHOT <CircleHelp size={14} />
            </div>
            <div className="estimate-row">
              <strong>{draft ? "Draft saved" : "Start here"}</strong>
              <span className="estimate-badge">Preparation only</span>
            </div>
            <p>
              Organise what you need to check, then review final details in
              myTax before you lodge.
            </p>
            <div className="estimate-footer">
              <span>Income details</span>
              <b>{draft ? "Added" : "Not started"}</b>
              <span>Records added</span>
              <b>{documents.length}</b>
            </div>
          </article>

          <article className="next-card">
            <div className="next-top">
              <span className="icon-orb">
                <ReceiptText size={21} />
              </span>
              <span className="next-count">NEXT UP · 4 MIN</span>
            </div>
            <h2>Review your deductions</h2>
            <p>We found a few common items worth checking.</p>
            <div className="card-actions">
              <button
                className="primary-button"
                onClick={() => openSection("Deductions")}
              >
                Review deductions <ArrowUpRight size={17} />
              </button>
              <a
                className="mytax-link"
                href="https://www.ato.gov.au/online"
                target="_blank"
                rel="noreferrer"
              >
                Continue in myTax <ArrowUpRight size={14} />
              </a>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <div className="return-column">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR RETURN</p>
                <h2>At a glance</h2>
              </div>
              <button
                className="link-button"
                onClick={() => openSection("Overview")}
              >
                View all <ChevronRight size={16} />
              </button>
            </div>
            <div className="progress-card">
              <div className="progress-meta">
                <span>RETURN PROGRESS</span>
                <b>{draft ? "5 of 5 complete" : "0 of 5 complete"}</b>
              </div>
              <div className="progress-bar">
                <i style={{ width: draft ? "100%" : "0%" }} />
              </div>
              <div className="steps">
                {(
                  [
                    ["Your details", draft ? "Complete" : "Not started", Boolean(draft)],
                    ["Income", draft ? "Complete" : "Not started", Boolean(draft)],
                    ["Deductions", draft ? "Complete" : "Not started", Boolean(draft)],
                    ["Medicare & offsets", draft ? "Complete" : "Not started", Boolean(draft)],
                    ["Final review", draft ? "Complete" : "Locked", Boolean(draft)],
                  ] as [string, string, boolean][]
                ).map(([title, status, done], index) => (
                  <button
                    className="step"
                    key={title}
                    onClick={() =>
                      index === 1
                        ? openSection("Income")
                        : index === 2
                          ? openSection("Deductions")
                          : openSection("Overview")
                    }
                  >
                    <span
                    className={`step-dot ${done ? "done" : index === 2 ? "pending" : ""}`}
                    >
                      {done ? <Check size={13} /> : index + 1}
                    </span>
                    <span className="step-title">
                      {title}
                      <small>{status}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="assistant-card" id="assistant">
            <div className="assistant-head">
              <span className="ai-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="eyebrow">AUSTAX GUIDE · PAGS</p>
                <h2>Ask anything</h2>
              </div>
              <button
                aria-label="More assistant options"
                onClick={() => setReply("AusTax Guide provides general preparation information only. It cannot access myTax, determine eligibility, or lodge a return.")}
              >
                <MoreHorizontal size={19} />
              </button>
            </div>
            <p className="assistant-intro">
              I can help you understand the ATO process and prepare a checklist.
              I can’t access myTax or lodge for you.
            </p>
            <div className="suggestions">
              {[
                "What can I claim for working from home?",
                "Do I need private health insurance details?",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setQuestion(item);
                    setReply("");
                  }}
                >
                  {item}
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            {reply && (
              <div className="ai-reply">
                <Bot size={16} />
                {reply}
              </div>
            )}
            <div className="ask-box">
              <input
                aria-label="Ask AusTax Assist"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAssistant()}
                placeholder="Ask AusTax Assist…"
              />
              <button
                onClick={askAssistant}
                aria-label="Ask assistant"
                disabled={isAsking}
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
            <p className="disclaimer">
              <LockKeyhole size={12} /> General information only — not tax
              advice. AusTax cannot lodge your return.
            </p>
          </aside>
        </section>

        <section className="lower-grid">
          <article className="deductions-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DEDUCTIONS</p>
                <h2>Keep more of what’s yours</h2>
              </div>
              <span className="deduction-total">
                {format(totalDeductions)} tracked
              </span>
            </div>
            <div className="deduction-list">
              {deductions.map((item, index) => {
                const Icon = item.icon === "receipt" ? ReceiptText : FileText;
                return (
                  <button
                    className="deduction-row"
                    key={`${item.title}-${index}`}
                    onClick={() =>
                      setDeductions((items) =>
                        items.map((record, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...record,
                                done: true,
                                amount: record.amount || 120,
                              }
                            : record,
                        ),
                      )
                    }
                  >
                    <span
                      className={`deduction-icon ${item.done ? "complete" : ""}`}
                    >
                      {item.done ? <Check size={16} /> : <Icon size={18} />}
                    </span>
                    <span className="deduction-copy">
                      <b>{item.title}</b>
                      <small>{item.note}</small>
                    </span>
                    <span className={item.amount ? "amount" : "add-details"}>
                      {item.amount ? format(item.amount) : "Add details"}
                    </span>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
            <button className="add-row" onClick={() => setShowNew(true)}>
              <Plus size={17} /> Add another deduction
            </button>
            <p className="microcopy">
              {completeCount} {completeCount === 1 ? "category" : "categories"}{" "}
              reviewed. Keep records for five years.
            </p>
          </article>

          <article className="documents-card" id="documents">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR DOCUMENTS</p>
                <h2>Everything in one place</h2>
              </div>
              <button
                className="link-button"
                onClick={() => fileInput.current?.click()}
              >
                Upload <Plus size={16} />
              </button>
            </div>
            <input
              aria-label="Upload tax-return documents"
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onClick={(event) => {
                event.currentTarget.value = "";
              }}
              onChange={(event) => upload(event.target.files)}
              hidden
            />
            {documents.slice(-2).map((file) => (
              <div className="file-row" key={file}>
                <span className="file-icon">
                  <FileText size={18} />
                </span>
                <span>
                  <b>{file}</b>
                  <small>Ready to review</small>
                </span>
                <Check size={17} />
              </div>
            ))}
            <button
              className="dropzone"
              onClick={() => fileInput.current?.click()}
            >
              <FolderUp size={20} />
              <span>
                Drop documents here or <b>browse files</b>
              </span>
              <small>PDF, JPG or PNG · max 10MB</small>
            </button>
            {documentMessage && (
              <p className="document-message" role="status">
                {documentMessage}
              </p>
            )}
          </article>
        </section>
      </main>

      <footer className="platform-footer">
        <span>Preparation support only — always review before lodging.</span>
        <a href="https://proappstore.online" target="_blank" rel="noreferrer">
          Built for ProAppStore
        </a>
      </footer>

      {showNew && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowNew(false)}>
              <X size={18} />
            </button>
            <p className="eyebrow">NEW DEDUCTION</p>
            <h2>What would you like to add?</h2>
            <p>
              Start a category and we’ll guide you through the records to keep.
            </p>
            <button onClick={() => addDeduction("Professional memberships")}>
              Professional memberships <ChevronRight size={16} />
            </button>
            <button onClick={() => addDeduction("Self-education")}>
              Self-education expenses <ChevronRight size={16} />
            </button>
            <button onClick={() => addDeduction("Other work expense")}>
              Other work expense <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {showDraft && (
        <DraftWizard
          key={`${draftStep}-${draft ? "saved" : "new"}`}
          initial={draft ?? undefined}
          startStep={draftStep}
          onSave={saveDraft}
          onClose={() => setShowDraft(false)}
        />
      )}
      {showPreferences && (
        <div
          className="modal-backdrop fixed inset-0 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
        >
          <section className="profile-panel w-[min(490px,calc(100vw-32px))] border-line bg-panel text-ink shadow-2xl">
            <header className="profile-head">
              <div>
                <p className="eyebrow">YOUR PROFILE</p>
                <h2 id="preferences-title">Preferences</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </header>
            <div className="profile-identity border-line bg-paper">
              <span className="profile-avatar">AS</span>
              <span>
                <b>AusTax profile</b>
                <small>Preparation data stays in this browser session.</small>
              </span>
            </div>
            <fieldset className="preference-group">
              <legend>
                <Settings2 size={16} /> Appearance
              </legend>
              <p>Choose how AusTax looks on this device.</p>
              <div className="preference-options grid grid-cols-3 gap-2">
                {(
                  [
                    ["system", "System", Monitor],
                    ["light", "Light", Sun],
                    ["dark", "Dark", Moon],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      preferences.theme === value ? "selected" : ""
                    }
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        theme: value,
                      }))
                    }
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="preference-group">
              <legend>
                <Type size={16} /> Text size
              </legend>
              <p>Adjust the reading size used across the app.</p>
              <div className="preference-options text-size-options grid grid-cols-3 gap-2">
                {(
                  [
                    ["small", "Small", "Aa"],
                    ["default", "Default", "Aa"],
                    ["large", "Large", "Aa"],
                  ] as const
                ).map(([value, label, sample]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      preferences.textSize === value ? "selected" : ""
                    }
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        textSize: value,
                      }))
                    }
                  >
                    <span className={`size-sample size-${value}`}>{sample}</span>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="preference-note">
              Preferences are saved on this device. AusTax does not save your
              TFN, myGov password, bank login, or identity-document number.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
