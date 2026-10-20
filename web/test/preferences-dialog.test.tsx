import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PreferencesDialog } from "../src/components/PreferencesDialog";

describe("PreferencesDialog", () => {
  it("reports only the changed appearance setting and closes from its button", () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(
      <PreferencesDialog
        preferences={{ theme: "system", textSize: "default" }}
        onChange={onChange}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Dark/ }));
    expect(onChange).toHaveBeenLastCalledWith({ theme: "dark" });

    fireEvent.click(screen.getByRole("button", { name: /Large/ }));
    expect(onChange).toHaveBeenLastCalledWith({ textSize: "large" });

    fireEvent.click(screen.getByRole("button", { name: "Close preferences" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
