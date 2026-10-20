import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DraftWizard } from "../src/components/DraftWizard";

describe("DraftWizard focus stability", () => {
  let triggerButton: HTMLButtonElement;

  afterEach(() => {
    triggerButton?.remove();
  });

  it("keeps focus where the user put it when the parent re-renders with a new onClose", () => {
    triggerButton = document.createElement("button");
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { rerender, unmount } = render(
      <DraftWizard selectedYear="2025-26" onClose={vi.fn()} onSave={vi.fn()} />,
    );
    const yesChoice = screen.getByRole("button", { name: "Yes" });
    yesChoice.focus();

    // App passes an inline onClose, so every parent render gives a new function.
    rerender(
      <DraftWizard selectedYear="2025-26" onClose={() => undefined} onSave={vi.fn()} />,
    );
    expect(document.activeElement).toBe(yesChoice);

    unmount();
    expect(document.activeElement).toBe(triggerButton);
  });

  it("still closes on Escape using the latest onClose", () => {
    triggerButton = document.createElement("button");
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const firstClose = vi.fn();
    const latestClose = vi.fn();
    const { rerender } = render(
      <DraftWizard selectedYear="2025-26" onClose={firstClose} onSave={vi.fn()} />,
    );
    rerender(
      <DraftWizard selectedYear="2025-26" onClose={latestClose} onSave={vi.fn()} />,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(firstClose).not.toHaveBeenCalled();
    expect(latestClose).toHaveBeenCalledTimes(1);
  });
});
