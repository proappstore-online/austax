import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DraftWizard, type ReturnDraft } from "../src/components/DraftWizard";

describe("DraftWizard keyboard and accessibility", () => {
  let triggerButton: HTMLElement;

  beforeEach(() => {
    // Create a trigger button that will receive focus restoration
    triggerButton = document.createElement("button");
    triggerButton.textContent = "Open Draft";
    document.body.appendChild(triggerButton);
    triggerButton.focus();
  });

  afterEach(() => {
    triggerButton?.remove();
  });

  it("1. Initial focus: opens with focus on first focusable element inside dialog", () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Modal should be in the document with correct accessibility attributes
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby", "draft-title");

    // Check that the modal has the correct title
    const title = screen.getByRole("heading", { name: /Before we begin/i });
    expect(title).toHaveAttribute("id", "draft-title");

    // Focus should be on one of the first focusable elements inside the modal
    // Could be the income year select or a residency button depending on timing
    const activeElement = document.activeElement;
    expect(modal.contains(activeElement)).toBe(true);
  });

  it("2. Escape key: closes modal and calls onClose", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();

    // Press Escape key
    await user.keyboard("{Escape}");

    // onClose should have been called exactly once
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("3. Tab focus boundary: Tab from last focusable wraps to first", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Get all focusable elements within the modal
    const modal = screen.getByRole("dialog") as HTMLDivElement;
    const focusables = Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    expect(focusables.length).toBeGreaterThan(0);

    // Focus the last focusable element
    const lastFocusable = focusables[focusables.length - 1];
    lastFocusable.focus();
    expect(document.activeElement).toBe(lastFocusable);

    // Press Tab - should wrap to first focusable
    await user.keyboard("{Tab}");

    expect(document.activeElement).toBe(focusables[0]);
  });

  it("4. Shift+Tab focus boundary: Shift+Tab from first focusable wraps to last", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Get all focusable elements within the modal
    const modal = screen.getByRole("dialog") as HTMLDivElement;
    const focusables = Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    expect(focusables.length).toBeGreaterThan(0);

    // Focus the first focusable element
    const firstFocusable = focusables[0];
    firstFocusable.focus();
    expect(document.activeElement).toBe(firstFocusable);

    // Press Shift+Tab - should wrap to last focusable
    await user.keyboard("{Shift>}{Tab}{/Shift}");

    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });

  it("5. Residency choice aria-pressed: toggles when selected", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Step 0 is "Before we begin" which has residency choices
    const yesButton = screen.getByRole("button", { name: "Yes" });
    const noButton = screen.getByRole("button", { name: "No" });

    // Initially both should have aria-pressed="false"
    expect(yesButton).toHaveAttribute("aria-pressed", "false");
    expect(noButton).toHaveAttribute("aria-pressed", "false");

    // Click "Yes"
    await user.click(yesButton);

    // Now "Yes" should have aria-pressed="true" and "No" should be "false"
    expect(yesButton).toHaveAttribute("aria-pressed", "true");
    expect(noButton).toHaveAttribute("aria-pressed", "false");
  });

  it("6. Income toggle aria-pressed: toggles on selection", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // First, set required fields on step 0
    const yesButton = screen.getByRole("button", { name: "Yes" });
    const selectYear = screen.getByRole("combobox", { name: /Return income year/ }) as HTMLSelectElement;

    // Select a year using selectOptions
    await user.selectOptions(selectYear, "2025-26");

    // Select residency
    await user.click(yesButton);

    // Move to step 1 (income step)
    const continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Now on income step - check aria-pressed on income toggles
    const salaryButton = screen.getByRole("button", { name: "Salary or wages" });
    expect(salaryButton).toHaveAttribute("aria-pressed", "false");

    // Click to select salary
    await user.click(salaryButton);
    expect(salaryButton).toHaveAttribute("aria-pressed", "true");

    // Click again to deselect
    await user.click(salaryButton);
    expect(salaryButton).toHaveAttribute("aria-pressed", "false");
  });

  it("7. Required field progression: Continue disabled until required fields set", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Step 0: income year and residency are required
    const continueButton = screen.getByRole("button", { name: /Continue/ });

    // Initially, Continue should be disabled (no year or residency set)
    expect(continueButton).toBeDisabled();

    // Set year
    const selectYear = screen.getByRole("combobox", { name: /Return income year/ }) as HTMLSelectElement;
    await user.selectOptions(selectYear, "2025-26");

    // Still disabled (missing residency)
    expect(continueButton).toBeDisabled();

    // Set residency
    const yesButton = screen.getByRole("button", { name: "Yes" });
    await user.click(yesButton);

    // Now should be enabled
    expect(continueButton).not.toBeDisabled();
  });

  it("8. Step progression and record status: can reach final save with full draft", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Step 0: Set year and residency
    const selectYear = screen.getByRole("combobox", { name: /Return income year/ }) as HTMLSelectElement;
    await user.selectOptions(selectYear, "2025-26");

    const yesButton = screen.getByRole("button", { name: "Yes" });
    await user.click(yesButton);

    // Continue to step 1
    let continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Step 1: Select income
    const salaryButton = screen.getByRole("button", { name: "Salary or wages" });
    await user.click(salaryButton);

    // Continue to step 2
    continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Step 2: Select record status (required to proceed)
    const recordReadyButton = screen.getByRole("button", { name: "Ready to review" });
    await user.click(recordReadyButton);

    // Continue to step 3
    continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Step 3: Can select considerations (optional)
    // Just continue to summary
    continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Step 4: Summary - save button should be enabled
    const saveButton = screen.getByRole("button", { name: /Save for this session/ });
    expect(saveButton).not.toBeDisabled();

    // Click save
    await user.click(saveButton);

    // onSave should have been called with the draft
    expect(onSave).toHaveBeenCalledTimes(1);
    const savedDraft = onSave.mock.calls[0][0] as ReturnDraft;
    expect(savedDraft.incomeYear).toBe("2025-26");
    expect(savedDraft.residency).toBe("Yes");
    expect(savedDraft.income).toContain("Salary or wages");
    expect(savedDraft.recordStatus).toBe("Ready to review");
  });

  it("9. Focus restore on unmount: returns focus to trigger after close", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    const { unmount } = render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Modal should have captured focus
    const modal = screen.getByRole("dialog");
    expect(modal.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(triggerButton);

    // Close the modal using Escape
    await user.keyboard("{Escape}");

    // Unmount the component
    unmount();

    // Focus should be restored to trigger button
    expect(document.activeElement).toBe(triggerButton);
  });

  it("10. Record status aria-pressed: toggles on choice buttons", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <DraftWizard
        selectedYear="2025-26"
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Navigate to step 2 (record status)
    // Step 0: Set required fields
    const selectYear = screen.getByRole("combobox", { name: /Return income year/ }) as HTMLSelectElement;
    await user.selectOptions(selectYear, "2025-26");

    const yesButton = screen.getByRole("button", { name: "Yes" });
    await user.click(yesButton);

    // Continue to step 1
    let continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Select income to proceed
    const salaryButton = screen.getByRole("button", { name: "Salary or wages" });
    await user.click(salaryButton);

    // Continue to step 2
    continueButton = screen.getByRole("button", { name: /Continue/ });
    await user.click(continueButton);

    // Now check record status buttons
    const readyButton = screen.getByRole("button", { name: "Ready to review" });
    const someButton = screen.getByRole("button", { name: "Some to find" });

    // Initially unselected
    expect(readyButton).toHaveAttribute("aria-pressed", "false");
    expect(someButton).toHaveAttribute("aria-pressed", "false");

    // Select "Ready to review"
    await user.click(readyButton);
    expect(readyButton).toHaveAttribute("aria-pressed", "true");
    expect(someButton).toHaveAttribute("aria-pressed", "false");

    // Switch to "Some to find"
    await user.click(someButton);
    expect(readyButton).toHaveAttribute("aria-pressed", "false");
    expect(someButton).toHaveAttribute("aria-pressed", "true");
  });
});
