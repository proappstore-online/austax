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

describe("App draft load racing a local save", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    saveMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not replace a draft the user just saved with a late server copy", async () => {
    let resolveLoad!: (value: Awaited<ReturnType<typeof loadLatestPreparationDraft>>) => void;
    loadMock.mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)));

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Start your draft/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Salary or wages" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Ready to review" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Save for this session/ }));

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/1 income area/)).toBeInTheDocument();

    // The server copy arrives after the local save and holds different data.
    await act(async () => {
      resolveLoad({
        id: "server-draft",
        draft: {
          incomeYear: "2024-25",
          residency: "No",
          income: ["Bank interest", "Rental income"],
          deductions: [],
          considerations: [],
          recordStatus: "Not sure",
        },
      });
    });

    expect(screen.queryByText(/2 income areas/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 income area/)).toBeInTheDocument();
    expect(saveMock.mock.calls[0][0]).not.toBe("server-draft");
  });
});
