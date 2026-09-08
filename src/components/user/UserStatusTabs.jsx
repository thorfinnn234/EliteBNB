/**
 * Renders accessible tab-like status controls for User pages such as Trips.
 * The parent owns the active state so preview data can be swapped for API
 * state without changing this presentational control.
 */
export default function UserStatusTabs({ activeTab, onChange, tabs }) {
  return (
    <div className="elite-user-tabs" role="tablist" aria-label="Status filters">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          className={activeTab === tab.value ? "is-active" : ""}
          key={tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
