import {
  AlertCircle,
  CheckCircle2,
  LifeBuoy,
  Percent,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Settings.css";

const booleanSettingKeys = ["MAINTENANCE_MODE", "REFUNDS_ENABLED"];
const confirmationSettingKeys = ["MAINTENANCE_MODE", "REFUNDS_ENABLED"];

const initialSettingsState = {
  error: "",
  loading: true,
  settings: [],
};

/**
 * Extracts the setting list from the finalized Admin settings response while
 * tolerating common collection wrappers. The page still renders only records
 * returned by the backend, so missing settings are never fabricated locally.
 */
function normalizeSettingsList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.settings)) return payload.settings;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes a single setting response after PATCH /admin/settings/{key}. The
 * backend is expected to return PlatformSettingResponse, but this also supports
 * a light wrapper without inventing replacement data.
 */
function normalizeSettingRecord(payload) {
  if (payload?.key) return payload;
  if (payload?.setting?.key) return payload.setting;
  if (payload?.data?.key) return payload.data;

  return null;
}

/**
 * Pulls the most useful backend validation/error message available without
 * exposing implementation details in the Admin interface.
 */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/**
 * Converts backend enum keys into calm presentation labels while preserving the
 * original key for API updates and comparisons.
 */
function formatEnum(value) {
  if (!value) return "Not recorded";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Formats setting timestamps as audit-style context. Dates are informational
 * only; they do not imply deployment or runtime health state.
 */
function formatDateTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Setting values are stored by the backend as strings. Boolean controls map to
 * "true" and "false" strings so the PATCH body matches the finalized contract.
 */
function normalizeBooleanValue(value) {
  return String(value).toLowerCase() === "true" ? "true" : "false";
}

/**
 * Initializes editable drafts from authoritative backend records. Description
 * is copied alongside value so saving a value does not accidentally erase the
 * current backend-provided description.
 */
function buildDrafts(settings) {
  return settings.reduce((drafts, setting) => {
    drafts[setting.key] = {
      description: setting.description ?? "",
      value: booleanSettingKeys.includes(setting.key)
        ? normalizeBooleanValue(setting.value)
        : String(setting.value ?? ""),
    };

    return drafts;
  }, {});
}

/**
 * Keeps the list synchronized after a confirmed backend update. The list is
 * authoritative when the backend returns a full PlatformSettingResponse.
 */
function replaceSetting(settings, updatedSetting) {
  return settings.map((setting) =>
    setting.key === updatedSetting.key ? updatedSetting : setting,
  );
}

/**
 * Returns factual, key-specific context without inventing downstream behavior
 * such as route locks, refund enforcement, email delivery, or fee impact.
 */
function getSettingCopy(key) {
  const copy = {
    SERVICE_FEE_PERCENTAGE: {
      icon: "fee",
      summary:
        "Stores the platform service fee percentage used by supported backend configuration.",
      valueLabel: "Service fee percentage",
    },
    SUPPORT_EMAIL: {
      icon: "support",
      summary:
        "Stores the support contact value returned by the platform settings API.",
      valueLabel: "Support email",
    },
    MAINTENANCE_MODE: {
      icon: "maintenance",
      summary:
        "Stores the platform-level maintenance flag. This page only manages the setting value.",
      valueLabel: "Maintenance mode",
    },
    REFUNDS_ENABLED: {
      icon: "refunds",
      summary:
        "Stores the platform-level refunds availability flag. Refund workflows remain backend-authoritative.",
      valueLabel: "Refunds enabled",
    },
  };

  return (
    copy[key] || {
      icon: "settings",
      summary: "Backend-returned platform setting.",
      valueLabel: "Setting value",
    }
  );
}

/**
 * Renders setting icons through static branches so the component does not rely
 * on dynamic component construction during render.
 */
function renderSettingIcon(iconKey, size = 18) {
  if (iconKey === "fee") return <Percent size={size} aria-hidden="true" />;
  if (iconKey === "support") return <LifeBuoy size={size} aria-hidden="true" />;
  if (iconKey === "maintenance") {
    return <ShieldCheck size={size} aria-hidden="true" />;
  }
  if (iconKey === "refunds") {
    return <WalletCards size={size} aria-hidden="true" />;
  }

  return <Settings2 size={size} aria-hidden="true" />;
}

/**
 * Compares current drafts against the backend record so Save buttons are only
 * active when an Admin has intentionally changed either value or description.
 */
function isDraftDirty(setting, draft) {
  if (!setting || !draft) return false;

  const currentValue = booleanSettingKeys.includes(setting.key)
    ? normalizeBooleanValue(setting.value)
    : String(setting.value ?? "");

  return (
    String(draft.value ?? "") !== currentValue ||
    String(draft.description ?? "") !== String(setting.description ?? "")
  );
}

/**
 * Performs light client validation only for input shape. Business validation,
 * allowed ranges, and final acceptance remain the backend's responsibility.
 */
function validateDraft(key, draft) {
  const value = String(draft?.value ?? "").trim();

  if (key === "SERVICE_FEE_PERCENTAGE") {
    if (!value || !Number.isFinite(Number(value))) {
      return "Enter a numeric service fee percentage. The backend will validate the allowed value.";
    }
  }

  if (key === "SUPPORT_EMAIL" && value) {
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!emailLooksValid) {
      return "Enter a valid email format before saving.";
    }
  }

  if (booleanSettingKeys.includes(key) && !["true", "false"].includes(value)) {
    return "Choose Enabled or Disabled before saving this boolean setting.";
  }

  return "";
}

/**
 * The pill is textual first, with color as support only, so boolean state
 * remains understandable for keyboard and screen-reader users.
 */
function SettingStateBadge({ setting, draft }) {
  if (booleanSettingKeys.includes(setting.key)) {
    const enabled = normalizeBooleanValue(draft?.value ?? setting.value) === "true";

    return (
      <span
        className={`elite-admin-settings__state ${
          enabled ? "is-enabled" : "is-disabled"
        }`}
      >
        <span aria-hidden="true" />
        {enabled ? "Enabled" : "Disabled"}
      </span>
    );
  }

  return (
    <span className="elite-admin-settings__state is-configured">
      <span aria-hidden="true" />
      Configured
    </span>
  );
}

/**
 * Key-aware editor for PlatformSettingResponse. Each supported setting uses the
 * simplest control that matches the backend string contract.
 */
function SettingValueControl({ draft, onChange, setting }) {
  const copy = getSettingCopy(setting.key);
  const inputId = `setting-${setting.key}-value`;
  const descriptionId = `setting-${setting.key}-hint`;

  if (setting.key === "SERVICE_FEE_PERCENTAGE") {
    return (
      <label className="elite-admin-settings__field" htmlFor={inputId}>
        <span>{copy.valueLabel}</span>
        <div className="elite-admin-settings__percent-control">
          <input
            id={inputId}
            inputMode="decimal"
            step="any"
            type="number"
            value={draft.value}
            aria-describedby={descriptionId}
            onChange={(event) => onChange("value", event.target.value)}
          />
          <strong aria-hidden="true">%</strong>
        </div>
        <small id={descriptionId}>
          Numeric format is checked here; backend validation decides accepted values.
        </small>
      </label>
    );
  }

  if (setting.key === "SUPPORT_EMAIL") {
    return (
      <label className="elite-admin-settings__field" htmlFor={inputId}>
        <span>{copy.valueLabel}</span>
        <input
          id={inputId}
          type="email"
          value={draft.value}
          aria-describedby={descriptionId}
          onChange={(event) => onChange("value", event.target.value)}
        />
        <small id={descriptionId}>
          This updates the stored support email setting only; no email provider action is triggered.
        </small>
      </label>
    );
  }

  if (booleanSettingKeys.includes(setting.key)) {
    const enabled = normalizeBooleanValue(draft.value) === "true";

    return (
      <fieldset
        className="elite-admin-settings__field elite-admin-settings__boolean-field"
        aria-describedby={descriptionId}
      >
        <legend>{copy.valueLabel}</legend>
        <div className="elite-admin-settings__toggle-group">
          <button
            type="button"
            aria-pressed={enabled}
            className={enabled ? "is-selected" : ""}
            onClick={() => onChange("value", "true")}
          >
            Enabled
          </button>
          <button
            type="button"
            aria-pressed={!enabled}
            className={!enabled ? "is-selected" : ""}
            onClick={() => onChange("value", "false")}
          >
            Disabled
          </button>
        </div>
        <small id={descriptionId}>
          Saved as a string value of "{enabled ? "true" : "false"}" for the backend settings contract.
        </small>
      </fieldset>
    );
  }

  return (
    <label className="elite-admin-settings__field" htmlFor={inputId}>
      <span>{copy.valueLabel}</span>
      <input
        id={inputId}
        type="text"
        value={draft.value}
        aria-describedby={descriptionId}
        onChange={(event) => onChange("value", event.target.value)}
      />
      <small id={descriptionId}>
        This fallback editor is shown only for backend-returned settings not yet
        given a specialized Admin control.
      </small>
    </label>
  );
}

/**
 * One editable backend setting. It owns presentation only; validation and saved
 * values remain controlled by the Admin settings endpoints.
 */
function SettingCard({
  draft,
  error,
  onChange,
  onSave,
  saving,
  setting,
  success,
}) {
  const copy = getSettingCopy(setting.key);
  const dirty = isDraftDirty(setting, draft);
  const descriptionId = `setting-${setting.key}-description`;

  return (
    <article className="elite-admin-settings__card">
      <header className="elite-admin-settings__card-header">
        <div className="elite-admin-settings__icon">
          {renderSettingIcon(copy.icon)}
        </div>
        <div>
          <span>{setting.key}</span>
          <h3>{formatEnum(setting.key)}</h3>
          <p>{copy.summary}</p>
        </div>
        <SettingStateBadge setting={setting} draft={draft} />
      </header>

      <div className="elite-admin-settings__editor">
        <SettingValueControl
          draft={draft}
          onChange={(field, value) => onChange(setting.key, field, value)}
          setting={setting}
        />

        <label className="elite-admin-settings__field" htmlFor={descriptionId}>
          <span>Description</span>
          <textarea
            id={descriptionId}
            rows={3}
            value={draft.description}
            onChange={(event) =>
              onChange(setting.key, "description", event.target.value)
            }
          />
          <small>
            Description is included in PATCH requests and remains unchanged unless edited here.
          </small>
        </label>
      </div>

      <footer className="elite-admin-settings__card-footer">
        <div>
          <span>Last updated</span>
          <strong>{formatDateTime(setting.updatedAt)}</strong>
        </div>
        <button
          type="button"
          className="elite-admin-settings__save"
          disabled={!dirty || saving}
          onClick={() => onSave(setting)}
        >
          {saving ? (
            <RefreshCw size={15} aria-hidden="true" />
          ) : (
            <Save size={15} aria-hidden="true" />
          )}
          {saving ? "Saving" : "Save setting"}
        </button>
      </footer>

      {error ? (
        <p className="elite-admin-settings__message is-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="elite-admin-settings__message is-success" role="status">
          <CheckCircle2 size={15} aria-hidden="true" />
          {success}
        </p>
      ) : null}
    </article>
  );
}

/**
 * Confirmation is used only for high-impact boolean settings. The modal states
 * what value is changing without inventing downstream enforcement behavior.
 */
function SettingsConfirmationModal({
  confirmation,
  onCancel,
  onConfirm,
  saving,
}) {
  if (!confirmation) return null;

  const { draft, setting } = confirmation;
  const currentValue = booleanSettingKeys.includes(setting.key)
    ? normalizeBooleanValue(setting.value)
    : String(setting.value ?? "");
  const nextValue = booleanSettingKeys.includes(setting.key)
    ? normalizeBooleanValue(draft.value)
    : String(draft.value ?? "");

  return (
    <div
      className="elite-admin-settings__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onCancel();
        }
      }}
    >
      <section
        aria-labelledby="settings-confirm-title"
        aria-modal="true"
        className="elite-admin-settings__modal"
        role="dialog"
      >
        <header className="elite-admin-settings__modal-header">
          <span>Confirm setting change</span>
          <button
            type="button"
            aria-label="Close confirmation"
            disabled={saving}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="elite-admin-settings__modal-body">
          <h3 id="settings-confirm-title">
            Save {formatEnum(setting.key)}?
          </h3>
          <p>
            This will update the backend setting value from{" "}
            <strong>{formatEnum(currentValue)}</strong> to{" "}
            <strong>{formatEnum(nextValue)}</strong>. Backend validation remains
            authoritative after you confirm.
          </p>
        </div>
        <footer className="elite-admin-settings__modal-actions">
          <button type="button" disabled={saving} onClick={onCancel}>
            Keep current value
          </button>
          <button type="button" disabled={saving} onClick={onConfirm}>
            {saving ? (
              <RefreshCw size={15} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={15} aria-hidden="true" />
            )}
            {saving ? "Saving" : "Confirm save"}
          </button>
        </footer>
      </section>
    </div>
  );
}

/**
 * Admin Platform Settings workspace.
 * Loads real PlatformSettingResponse records, renders key-aware controls for
 * the finalized setting keys, and saves each setting through PATCH
 * /admin/settings/{key} without introducing local-only configuration behavior.
 */
export default function Settings() {
  const [settingsState, setSettingsState] = useState(initialSettingsState);
  const [drafts, setDrafts] = useState({});
  const [reloadToken, setReloadToken] = useState(0);
  const [messages, setMessages] = useState({ errors: {}, successes: {} });
  const [savingKey, setSavingKey] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useBodyScrollLock(Boolean(confirmation));

  /**
   * Settings are loaded as one registry request. The detail endpoint exists,
   * but the list response already contains the authoritative fields this page
   * needs, so unnecessary per-setting requests are avoided.
   */
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setSettingsState((previous) => ({
        ...previous,
        error: "",
        loading: true,
      }));

      try {
        const response = await adminService.getSettings();
        const settings = normalizeSettingsList(response.data);

        if (!active) return;

        setSettingsState({
          error: "",
          loading: false,
          settings,
        });
        setDrafts(buildDrafts(settings));
      } catch (error) {
        if (!active) return;

        setSettingsState({
          error: getErrorMessage(
            error,
            "Unable to load platform settings right now.",
          ),
          loading: false,
          settings: [],
        });
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const configuredCount = settingsState.settings.length;

  const booleanCount = useMemo(
    () =>
      settingsState.settings.filter((setting) =>
        booleanSettingKeys.includes(setting.key),
      ).length,
    [settingsState.settings],
  );

  /**
   * Draft updates are local until Save. This prevents accidental autosaves and
   * keeps backend validation errors attached to the setting being edited.
   */
  function handleDraftChange(key, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] || { description: "", value: "" }),
        [field]: value,
      },
    }));
    setMessages((previous) => ({
      errors: { ...previous.errors, [key]: "" },
      successes: { ...previous.successes, [key]: "" },
    }));
  }

  /**
   * Routes high-impact boolean changes through confirmation while allowing
   * ordinary settings to save directly through the same backend mutation.
   */
  function handleSaveRequest(setting) {
    const draft = drafts[setting.key];
    const validationError = validateDraft(setting.key, draft);

    if (validationError) {
      setMessages((previous) => ({
        ...previous,
        errors: { ...previous.errors, [setting.key]: validationError },
      }));
      return;
    }

    if (confirmationSettingKeys.includes(setting.key)) {
      setConfirmation({ draft, setting });
      return;
    }

    submitSetting(setting, draft);
  }

  /**
   * Saves a single setting only after validation/confirmation. The UI updates
   * after the backend responds, avoiding fake optimistic configuration state.
   */
  async function submitSetting(setting, overrideDraft) {
    const draft = overrideDraft || drafts[setting.key];
    const payload = {
      description: draft.description ?? "",
      value: booleanSettingKeys.includes(setting.key)
        ? normalizeBooleanValue(draft.value)
        : String(draft.value ?? ""),
    };

    setSavingKey(setting.key);
    setMessages((previous) => ({
      errors: { ...previous.errors, [setting.key]: "" },
      successes: { ...previous.successes, [setting.key]: "" },
    }));

    try {
      const response = await adminService.updateSetting(setting.key, payload);
      const updatedSetting = normalizeSettingRecord(response.data);

      if (updatedSetting?.key) {
        setSettingsState((previous) => ({
          ...previous,
          settings: replaceSetting(previous.settings, updatedSetting),
        }));
        setDrafts((previous) => ({
          ...previous,
          [updatedSetting.key]: buildDrafts([updatedSetting])[updatedSetting.key],
        }));
      } else {
        /**
         * If the backend ever returns an empty success body, reloading the list
         * restores authority without inventing the updated record locally.
         */
        setReloadToken((token) => token + 1);
      }

      setMessages((previous) => ({
        errors: { ...previous.errors, [setting.key]: "" },
        successes: {
          ...previous.successes,
          [setting.key]: `${formatEnum(setting.key)} saved.`,
        },
      }));
      setConfirmation(null);
    } catch (error) {
      setMessages((previous) => ({
        ...previous,
        errors: {
          ...previous.errors,
          [setting.key]: getErrorMessage(
            error,
            "Unable to save this setting right now.",
          ),
        },
      }));
    } finally {
      setSavingKey("");
    }
  }

  return (
    <main className="elite-admin-settings">
      <section className="elite-admin-settings__header">
        <div>
          <span>PLATFORM GOVERNANCE</span>
          <h2>Settings</h2>
          <p>
            Manage the supported EliteBNB platform-level configuration returned
            by the Admin settings backend.
          </p>
        </div>
        <aside aria-label="Settings count">
          <Settings2 size={22} aria-hidden="true" />
          <strong>{configuredCount} settings</strong>
          <small>
            {booleanCount} boolean control{booleanCount === 1 ? "" : "s"} shown
            from the backend registry.
          </small>
        </aside>
      </section>

      {settingsState.loading ? (
        <section
          aria-label="Loading platform settings"
          className="elite-admin-settings__loading"
        >
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="elite-admin-settings__skeleton" />
          ))}
        </section>
      ) : null}

      {!settingsState.loading && settingsState.error ? (
        <section className="elite-admin-settings__empty-state" role="alert">
          <AlertCircle size={28} aria-hidden="true" />
          <h3>Settings could not be loaded</h3>
          <p>{settingsState.error}</p>
          <button type="button" onClick={() => setReloadToken((token) => token + 1)}>
            <RefreshCw size={15} aria-hidden="true" />
            Retry
          </button>
        </section>
      ) : null}

      {!settingsState.loading &&
      !settingsState.error &&
      settingsState.settings.length === 0 ? (
        <section className="elite-admin-settings__empty-state">
          <Settings2 size={28} aria-hidden="true" />
          <h3>No platform settings returned</h3>
          <p>
            Only backend-configured platform settings are shown here. No local
            placeholder settings are created on the frontend.
          </p>
        </section>
      ) : null}

      {!settingsState.loading &&
      !settingsState.error &&
      settingsState.settings.length > 0 ? (
        <section
          aria-label="Editable platform settings"
          className="elite-admin-settings__workspace"
        >
          {settingsState.settings.map((setting) => (
            <SettingCard
              key={setting.key}
              draft={drafts[setting.key] || { description: "", value: "" }}
              error={messages.errors[setting.key]}
              onChange={handleDraftChange}
              onSave={handleSaveRequest}
              saving={savingKey === setting.key}
              setting={setting}
              success={messages.successes[setting.key]}
            />
          ))}
        </section>
      ) : null}

      <SettingsConfirmationModal
        confirmation={confirmation}
        saving={Boolean(savingKey)}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation) {
            submitSetting(confirmation.setting, confirmation.draft);
          }
        }}
      />
    </main>
  );
}
