import { useState } from "react";
import { AlertCircle, Bell, CreditCard, Globe, Lock } from "lucide-react";

/**
 * Defines the Settings navigation without implying every section has backend
 * persistence. Host settings do not have a saved account contract yet, so most
 * panes are informational until the backend exposes real endpoints.
 */
const settingsTabs = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "preferences", label: "Preferences", icon: Globe },
  { id: "payouts", label: "Payouts", icon: CreditCard },
];

/**
 * Lists unsupported account/business settings as future backend work rather
 * than showing switches that look saved but only mutate local React state.
 */
const pendingSettings = {
  notifications: {
    title: "Notification controls",
    summary:
      "Host notification delivery preferences need a dedicated backend contract before they can be changed here.",
    rows: [
      "Booking alerts",
      "Guest message notifications",
      "Review notifications",
      "Weekly hosting summary",
    ],
  },
  privacy: {
    title: "Privacy and visibility",
    summary:
      "Profile visibility and guest-contact rules must be enforced by the backend before this screen can edit them.",
    rows: [
      "Public host profile visibility",
      "Pre-booking guest messages",
      "Business summary visibility",
    ],
  },
};

/**
 * Keeps harmless display preferences clearly frontend-only. They help the
 * current interface preview presentation without claiming account persistence.
 */
const presentationPreferenceOptions = {
  language: [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
  ],
  currency: [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "NGN", label: "NGN (₦)" },
  ],
};

/**
 * Renders the Host Settings surface in a truthful pre-contract state. The page
 * intentionally avoids fake payout accounts, fake payment methods, and save
 * controls until real Host settings endpoints exist.
 */
export default function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [presentationPreferences, setPresentationPreferences] = useState({
    language: "en",
    currency: "USD",
  });

  /**
   * Updates temporary presentation preferences only. Nothing here is sent to
   * the backend or represented as saved account/business configuration.
   */
  const handlePresentationPreferenceChange = (key, value) => {
    setPresentationPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const pendingPane = pendingSettings[activeTab];

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            CONFIGURATION
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-[#64748B]">
            Review Host workspace preferences. Account-level settings are
            marked as unavailable until the backend provides a real persistence
            contract.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 border-b border-[#E5E7EB]">
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition ${
                activeTab === id
                  ? "border-[#D4A72C] text-[#D4A72C]"
                  : "border-transparent text-[#64748B] hover:text-[#172554]"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {pendingPane ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex gap-3 rounded-xl border border-[#D4A72C]/30 bg-[#FAF9F6] p-4">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-[#D4A72C]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-bold text-[#172554]">
                  {pendingPane.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  {pendingPane.summary}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pendingPane.rows.map((label) => (
                <div
                  key={label}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3 last:border-0"
                >
                  <p className="font-medium text-[#172554]">{label}</p>
                  <span className="rounded-full border border-[#E5E7EB] bg-[#FAF9F6] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
                    Coming later
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "preferences" ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#172554]">
              Presentation preferences
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
              These controls are temporary frontend preferences for this screen.
              They are not saved to the Host account until a settings API is
              available.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#64748B]">
                  Language
                </span>
                <select
                  value={presentationPreferences.language}
                  onChange={(event) =>
                    handlePresentationPreferenceChange(
                      "language",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  {presentationPreferenceOptions.language.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#64748B]">
                  Currency display
                </span>
                <select
                  value={presentationPreferences.currency}
                  onChange={(event) =>
                    handlePresentationPreferenceChange(
                      "currency",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  {presentationPreferenceOptions.currency.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "payouts" ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-[#D4A72C]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-[#172554]">
                  Payout settings need backend support
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                  EliteBNB does not currently expose a Host payout-settings
                  contract here, so bank accounts, payment methods, add/remove
                  actions, and save controls are intentionally not displayed.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
