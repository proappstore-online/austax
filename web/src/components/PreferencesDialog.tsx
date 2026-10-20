import { X, Settings2, Type, Monitor, Sun, Moon } from "lucide-react";
import type { Preferences } from "../lib/app-storage";

type PreferencesDialogProps = {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  onClose: () => void;
};

export function PreferencesDialog({ preferences, onChange, onClose }: PreferencesDialogProps) {
  return (
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
                onClick={onClose}
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
                      onChange({ theme: value })
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
                      onChange({ textSize: value })
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
  );
}
