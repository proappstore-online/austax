import { useMemo, useRef, useState } from "react";
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
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
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

const format = (amount: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function App() {
  const [active, setActive] = useState("Overview");
  const [deductions, setDeductions] = useState(starterDeductions);
  const [documents, setDocuments] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [draft, setDraft] = useState<ReturnDraft | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const totalDeductions = useMemo(
    () => deductions.reduce((total, item) => total + item.amount, 0),
    [deductions],
  );
  const completeCount = deductions.filter((item) => item.done).length;

  async function askAssistant() {
    const cleaned = question.trim();
    if (!cleaned) return;
    setReply("Checking the AusTax Guide…");
    setQuestion("");
    try {
      const result = await askAusTaxGuide(cleaned);
      setReply(result.reply);
    } catch {
      setReply(
        "I can help organise what you need to check, but I can’t decide eligibility, calculate a final outcome, or lodge a return. Check the official ATO guidance or speak with a registered tax agent before lodging.",
      );
    }
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
    setDocuments((items) => [
      ...items,
      ...Array.from(files).map((file) => file.name),
    ]);
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
        <a className="brand" href="#top" onClick={() => setActive("Overview")}>
          <span className="brand-mark">a</span>
          <span>AusTax</span>
        </a>
        <div className="year-pill">
          2025–26 return <ChevronRight size={14} />
        </div>
        <div className="top-actions">
          <button className="help-button">
            <CircleHelp size={18} />
            <span>Help</span>
          </button>
          <button className="avatar" aria-label="Open profile">
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
              onClick={() => {
                setActive(label);
                if (label === "Income" || label === "Deductions")
                  setShowDraft(true);
                setShowMenu(false);
              }}
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
          <button className="tax-agent">
            Need a tax agent? <ArrowUpRight size={14} />
          </button>
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
            <h1>Good morning, Alex.</h1>
            <p className="subhead">
              Let’s get your return ready. You’re making great progress.
            </p>
          </div>
          <button className="start-draft" onClick={() => setShowDraft(true)}>
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
            <button className="link-button" onClick={() => setShowDraft(true)}>
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
                onClick={() => setActive("Deductions")}
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
                onClick={() => setActive("Overview")}
              >
                View all <ChevronRight size={16} />
              </button>
            </div>
            <div className="progress-card">
              <div className="progress-meta">
                <span>RETURN PROGRESS</span>
                <b>2 of 5 complete</b>
              </div>
              <div className="progress-bar">
                <i />
              </div>
              <div className="steps">
                {(
                  [
                    ["Your details", "Complete", true],
                    ["Income", "Complete", true],
                    ["Deductions", "Needs review", false],
                    ["Medicare & offsets", "Not started", false],
                    ["Final review", "Locked", false],
                  ] as [string, string, boolean][]
                ).map(([title, status, done], index) => (
                  <button
                    className="step"
                    key={title}
                    onClick={() =>
                      setActive(
                        index === 1
                          ? "Income"
                          : index === 2
                            ? "Deductions"
                            : "Overview",
                      )
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

          <aside className="assistant-card">
            <div className="assistant-head">
              <span className="ai-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="eyebrow">AUSTAX GUIDE · PAGS</p>
                <h2>Ask anything</h2>
              </div>
              <button aria-label="More assistant options">
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
              <button onClick={askAssistant} aria-label="Ask assistant">
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

          <article className="documents-card">
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
          initial={draft ?? undefined}
          onSave={saveDraft}
          onClose={() => setShowDraft(false)}
        />
      )}
    </div>
  );
}
