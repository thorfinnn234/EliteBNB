import { useState } from "react";
import { Bell, Lock, Globe, CreditCard, AlertCircle, ToggleLeft } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emails: true,
      bookingAlerts: true,
      messageNotifications: true,
      reviewNotifications: false,
      weeklyReport: true,
    },
    privacy: {
      showProfile: true,
      allowMessages: true,
      showEarnings: false,
    },
    language: "en",
    currency: "USD",
    paymentMethod: "Bank Transfer",
  });

  const [activeTab, setActiveTab] = useState("notifications");

  const handleToggle = (category, key) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            CONFIGURATION
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-[#64748B]">
            Manage your account preferences and settings.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-[#E5E7EB]">
          {[
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "privacy", label: "Privacy", icon: Lock },
            { id: "preferences", label: "Preferences", icon: Globe },
            { id: "payments", label: "Payments", icon: CreditCard },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition ${
                activeTab === id
                  ? "border-[#D4A72C] text-[#D4A72C]"
                  : "border-transparent text-[#64748B] hover:text-[#172554]"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#172554]">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {[
                { key: "emails", label: "Email Notifications", description: "Receive general email updates" },
                { key: "bookingAlerts", label: "Booking Alerts", description: "Get notified when you receive new bookings" },
                { key: "messageNotifications", label: "Message Notifications", description: "Receive alerts for new guest messages" },
                { key: "reviewNotifications", label: "Review Notifications", description: "Get notified when guests leave reviews" },
                { key: "weeklyReport", label: "Weekly Report", description: "Receive a weekly summary of your activity" },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 last:border-0">
                  <div>
                    <p className="font-medium text-[#172554]">{label}</p>
                    <p className="text-sm text-[#64748B]">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle("notifications", key)}
                    className={`rounded-full p-2 transition ${
                      settings.notifications[key]
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <ToggleLeft size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#172554]">
              Privacy Settings
            </h2>

            <div className="space-y-4">
              {[
                { key: "showProfile", label: "Show Profile Publicly", description: "Allow guests to see your profile" },
                { key: "allowMessages", label: "Allow Guest Messages", description: "Let guests message you before booking" },
                { key: "showEarnings", label: "Show Earnings Summary", description: "Display earnings on your dashboard" },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 last:border-0">
                  <div>
                    <p className="font-medium text-[#172554]">{label}</p>
                    <p className="text-sm text-[#64748B]">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle("privacy", key)}
                    className={`rounded-full p-2 transition ${
                      settings.privacy[key]
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <ToggleLeft size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#172554]">
              Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#172554]">
              Payment Settings
            </h2>

            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#172554]">Payment Information</p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Manage how you receive payouts and add payment methods.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#64748B] mb-2">
                  Default Payment Method
                </label>
                <select
                  value={settings.paymentMethod}
                  onChange={(e) => handleChange("paymentMethod", e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Paypal">PayPal</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Wise">Wise (TransferWise)</option>
                </select>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6">
                <h3 className="font-medium text-[#172554] mb-4">Saved Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-4 bg-[#FAF9F6]">
                    <div>
                      <p className="font-medium text-[#172554]">Bank Account - ...6789</p>
                      <p className="text-sm text-[#64748B]">Default payment method</p>
                    </div>
                    <button className="text-red-600 font-medium text-sm hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-xl border border-[#D4A72C] px-4 py-3 font-medium text-[#D4A72C] hover:bg-[#D4A72C]/10">
                Add Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex gap-3">
          <button className="flex-1 rounded-xl bg-[#D4A72C] px-6 py-3 font-semibold text-white hover:bg-[#b88d1d]">
            Save Changes
          </button>
          <button className="flex-1 rounded-xl border border-[#E5E7EB] px-6 py-3 font-semibold text-[#172554] hover:bg-[#FAF9F6]">
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
