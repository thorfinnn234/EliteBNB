import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { userProfileService } from "../../services/userProfileService";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  location: "",
  bio: "",
};

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  const visibleName =
    name.length <= 2
      ? `${name.charAt(0)}***`
      : `${name.slice(0, 2)}***${name.slice(-1)}`;

  return `${visibleName}@${domain}`;
};

export default function UserProfile() {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await userProfileService.getProfile();

      const data = response.data;

      setProfile(data);

      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        location: data.location || "",
        bio: data.bio || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await userProfileService.updateProfile({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          location: form.location.trim(),
          bio: form.bio.trim(),
        });

      setProfile(response.data);

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Profile image must be smaller than 10MB.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const response =
        await userProfileService.uploadImage(file);

      setProfile(response.data);

      setSuccess("Profile photo updated.");
    } catch (err) {
      console.error("Image upload failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't upload your profile photo."
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const initials = `${profile?.firstName?.[0] || ""}${
    profile?.lastName?.[0] || ""
  }`.toUpperCase();
  const completionItems = [
    {
      label: "Name",
      complete: Boolean(profile.firstName && profile.lastName),
    },
    {
      label: "Email",
      complete: Boolean(profile.email),
    },
    {
      label: "Phone",
      complete: Boolean(profile.phoneNumber),
    },
    {
      label: "Location",
      complete: Boolean(profile.location),
    },
    {
      label: "Bio",
      complete: Boolean(profile.bio),
    },
    {
      label: "Photo",
      complete: Boolean(profile.profileImageUrl),
    },
  ];
  const completedItems = completionItems.filter(
    (item) => item.complete
  ).length;
  const completionPercent = Math.round(
    (completedItems / completionItems.length) * 100
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-5 py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#D4A72C]" />

            <p className="mt-3 text-sm font-medium text-[#64748B]">
              Loading your profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-5 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-10 text-center">
          <h2 className="text-xl font-extrabold text-[#172554]">
            Profile unavailable
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {String(error || "Unable to load your profile.")}
          </p>

          <button
            type="button"
            onClick={loadProfile}
            className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
            Your account
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
            Personal profile
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
            Keep your personal information and profile details
            up to date.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* PROFILE CARD */}
          <aside className="h-fit rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-[#FAF9F6]"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#172554] text-3xl font-extrabold text-white ring-4 ring-[#FAF9F6]">
                    {initials || (
                      <UserRound className="h-10 w-10" />
                    )}
                  </div>
                )}

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#D4A72C] text-[#172554] shadow-md transition hover:scale-105 disabled:cursor-wait"
                  aria-label="Change profile photo"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-[#172554]">
                {profile.firstName} {profile.lastName}
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                EliteBNB guest
              </p>
            </div>

            <div className="mt-7 rounded-2xl bg-[#FAF9F6] p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#172554]">
                    Complete profile
                  </h3>

                  <p className="mt-1 text-xs text-[#64748B]">
                    {completedItems} of {completionItems.length} completed
                  </p>
                </div>

                <p className="text-2xl font-extrabold text-[#D4A72C]">
                  {completionPercent}%
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#D4A72C] transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>

              <div className="mt-4 space-y-2">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-semibold text-[#64748B]">
                      {item.label}
                    </span>

                    <span
                      className={
                        item.complete
                          ? "font-bold text-green-700"
                          : "font-bold text-[#94A3B8]"
                      }
                    >
                      {item.complete ? "Done" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 border-t border-[#E5E7EB] pt-5">
              <ProfileInfo
                icon={Mail}
                label="Email"
                value={maskEmail(profile.email)}
              />

              <ProfileInfo
                icon={Phone}
                label="Phone"
                value={
                  profile.phoneNumber ||
                  "Not provided"
                }
              />

              <ProfileInfo
                icon={MapPin}
                label="Location"
                value={
                  profile.location ||
                  "Not provided"
                }
              />
            </div>
          </aside>

          {/* FORM */}
          <section className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h2 className="text-xl font-extrabold text-[#172554]">
                Profile information
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Edit the information associated with your
                EliteBNB profile.
              </p>
            </div>

            {success && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <Check className="h-4 w-4" />
                {success}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {String(error)}
              </div>
            )}

            <form
              onSubmit={handleSave}
              className="mt-7"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Your first name"
                  required
                />

                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Your last name"
                  required
                />

                <FormField
                  label="Phone number"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="+234..."
                />

                <FormField
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Lagos, Nigeria"
                />
              </div>

              {/* EMAIL */}
              <div className="mt-5">
                <label className="text-sm font-bold text-[#172554]">
                  Email address
                </label>

                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />

                  <input
                    value={maskEmail(profile.email)}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-3 pl-11 pr-4 text-sm text-[#64748B]"
                  />
                </div>

                <p className="mt-2 text-xs text-[#94A3B8]">
                  Your login email cannot be changed here.
                </p>
              </div>

              {/* BIO */}
              <div className="mt-5">
                <div className="flex justify-between gap-3">
                  <label className="text-sm font-bold text-[#172554]">
                    About you
                  </label>

                  <span className="text-xs text-[#94A3B8]">
                    {form.bio.length}/1000
                  </span>
                </div>

                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={5}
                  placeholder="Tell hosts a little about yourself..."
                  className="mt-2 w-full resize-none rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/10"
                />
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-[#172554] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A8A] disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="text-sm font-bold text-[#172554]">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/10"
      />
    </div>
  );
}

function ProfileInfo({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FAF9F6]">
        <Icon className="h-4 w-4 text-[#D4A72C]" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#94A3B8]">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-[#172554]">
          {value}
        </p>
      </div>
    </div>
  );
}
