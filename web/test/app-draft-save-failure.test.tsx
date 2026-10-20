import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";
import { loadLatestPreparationDraft, savePreparationDraft } from "../src/lib/preparation-actions";

vi.mock("../src/lib/preparation-actions", () => ({
  loadLatestPreparationDraft: vi.fn(),
  savePreparationDraft: vi.fn(),
}));

const loadMock = vi.mocked(loadLatestPreparationDraft);
const saveMock = vi.mocked(savePreparationDraft);

function completeWizard() {
  fireEvent.click(screen.getByRole("button", { name: /Start your draft/ }));
  fireEvent.click(screen.getByRole("button", { name: "Yes" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Salary or wages" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Ready to review" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: /Save for this session/ }));
}

describe("App when the account save fails", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    loadMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tells the user the draft is only kept in this browser", async () => {
    saveMock.mockRejectedValue(new Error("The preparation draft was not saved"));

    render(<App />);
    completeWizard();
    await act(async () => {});

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be saved to your AusTax account/);
    expect(screen.getByText("Saved in this browser only")).toBeInTheDocument();
    expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();
    // The local copy is kept rather than discarded.
    expect(screen.getByText(/1 income area/)).toBeInTheDocument();
  }, 15_000);

  it("does not let an earlier failed save override a later successful one", async () => {
    let rejectFirst!: (error: Error) => void;
    saveMock
      .mockReturnValueOnce(new Promise<void>((_, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(undefined);

    render(<App />);
    completeWizard();

    const year = screen.getByRole("combobox", { name: "Return income year" });
    const otherYear = Array.from((year as HTMLSelectElement).options).find(
      (option) => option.value && option.value !== (year as HTMLSelectElement).value,
    )!.value;
    await act(async () => {
      fireEvent.change(year, { target: { value: otherYear } });
    });
    expect(saveMock).toHaveBeenCalledTimes(2);

    await act(async () => rejectFirst(new Error("The preparation draft was not saved")));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Draft saved")).toBeInTheDocument();
  }, 15_000);
});
