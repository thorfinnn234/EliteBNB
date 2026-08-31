import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";

import { hostProfileService } from "../../services/hostProfileService";
import { useAuth } from "../../hooks/useAuth";

export default function HostProfile() {
  const fileInputRef = useRef(null);
  const auth = useAuth();

  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    location: "",
    bio: "",
    profileImageUrl: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const syncProfileState = useCallback(
    (updatedProfile) => {
      auth?.setUser?.((currentUser) => ({
        ...currentUser,
        ...updatedProfile,
        role:
          currentUser?.role ||
          updatedProfile?.role ||
          "HOST",
      }));

      window.dispatchEvent(
        new CustomEvent("host-profile-updated")
      );
    },
    [auth]
  );

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await hostProfileService.getProfile();

      const data = response.data;

      setProfile(data);
      syncProfileState(data);

      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        location: data.location || "",
        bio: data.bio || "",
        profileImageUrl:
          data.profileImageUrl || "",
      });
    } catch (err) {
      console.error(
        "Failed to load host profile:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, [syncProfileState]);

  useEffect(() => {
    const timerId = window.setTimeout(loadProfile, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setSuccess("");
    setError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phoneNumber:
          profile.phoneNumber || "",
        location: profile.location || "",
        bio: profile.bio || "",
        profileImageUrl:
          profile.profileImageUrl || "",
      });
    }

    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber:
          formData.phoneNumber.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
      };

      const response =
        await hostProfileService.updateProfile(
          payload
        );

      const updatedProfile = response.data;

      setProfile(updatedProfile);
      syncProfileState(updatedProfile);

      setFormData({
        firstName:
          updatedProfile.firstName || "",
        lastName:
          updatedProfile.lastName || "",
        email: updatedProfile.email || "",
        phoneNumber:
          updatedProfile.phoneNumber || "",
        location:
          updatedProfile.location || "",
        bio: updatedProfile.bio || "",
        profileImageUrl:
          updatedProfile.profileImageUrl || "",
      });

      setSuccess(
        "Profile updated successfully."
      );

      setIsEditing(false);
    } catch (err) {
      console.error(
        "Failed to update profile:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      const response =
        await hostProfileService.uploadProfileImage(
          file
        );

      const updatedProfile = response.data;

      setProfile(updatedProfile);
      syncProfileState(updatedProfile);

      setFormData((current) => ({
        ...current,
        profileImageUrl:
          updatedProfile.profileImageUrl ||
          "",
      }));

      setSuccess(
        "Profile photo updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to upload profile image:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to upload profile photo."
      );
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const initials = `${
    formData.firstName?.[0] || ""
  }${formData.lastName?.[0] || ""}`.toUpperCase();

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-[#D4A72C]"
              />

              <p className="mt-3 font-medium text-[#64748B]">
                Loading your profile...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              ACCOUNT
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              Host Profile
            </h1>

            <p className="mt-2 text-[#64748B]">
              Manage your personal information
              and public host profile.
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A72C] px-5 py-3 font-semibold text-white transition hover:bg-[#b88d1d]"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {/* MESSAGES */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* PROFILE CARD */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">

          {/* AVATAR */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            <div className="relative h-28 w-28 shrink-0">

              {formData.profileImageUrl ? (
                <img
                  src={
                    formData.profileImageUrl
                  }
                  alt={`${formData.firstName} ${formData.lastName}`}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A72C] to-[#b88d1d] text-3xl font-bold text-white shadow-md">
                  {initials || (
                    <UserRound size={34} />
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={uploadingImage}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#172554] text-white shadow-md transition hover:bg-[#243b77] disabled:opacity-60"
                title="Change profile photo"
              >
                {uploadingImage ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Camera size={16} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#172554]">
                {formData.firstName}{" "}
                {formData.lastName}
              </h2>

              <p className="mt-1 text-[#64748B]">
                EliteBNB Host
              </p>

              <div className="mt-3 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                Verified Host
              </div>

              <p className="mt-3 text-xs text-[#94A3B8]">
                Click the camera icon to change
                your profile photo.
              </p>
            </div>
          </div>

          <div className="my-8 border-t border-[#E5E7EB]" />

          {/* PERSONAL INFORMATION */}
          <div>
            <h3 className="mb-6 text-lg font-bold text-[#172554]">
              Personal Information
            </h3>

            <div className="grid gap-6 md:grid-cols-2">

              {/* FIRST NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#64748B]">
                  First Name
                </label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-3 text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* LAST NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#64748B]">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-3 text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* EMAIL */}
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#64748B]">
                  <Mail size={16} />
                  Email Address
                </label>

                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-[#E5E7EB] bg-[#F1F5F9] px-4 py-3 text-[#64748B]"
                />

                <p className="mt-2 text-xs text-[#94A3B8]">
                  Your verified email cannot be
                  changed from this page.
                </p>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#64748B]">
                  <Phone size={16} />
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="e.g. 08012345678"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-3 text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* LOCATION */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#64748B]">
                  <MapPin size={16} />
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Lagos, Nigeria"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-3 text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* BIO */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#64748B]">
                  About You
                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={5}
                  maxLength={1000}
                  placeholder="Tell guests a little about yourself as a host..."
                  className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-3 text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                {isEditing && (
                  <p className="mt-2 text-right text-xs text-[#94A3B8]">
                    {formData.bio.length}/1000
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          {isEditing && (
            <div className="mt-8 flex flex-col gap-3 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-5 py-3 font-semibold text-[#172554] transition hover:bg-[#FAF9F6] disabled:opacity-50"
              >
                <X size={18} />
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A72C] px-6 py-3 font-semibold text-white transition hover:bg-[#b88d1d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
