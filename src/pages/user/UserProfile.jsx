import {
  ArrowRight,
  Heart,
  LogOut,
  MapPin,
  Mail,
  PenLine,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GuestAvatar from "../../components/user/GuestAvatar";
import UserPageHeader from "../../components/user/UserPageHeader";
import { useAuth } from "../../hooks/useAuth";
import { useGuestAvatar } from "../../hooks/useGuestAvatar";
import { userProfileData } from "../../data/userHomeData";
import "./UserHome.css";
import "./UserPages.css";

/**
 * Creates a safe editable profile snapshot from the available user object.
 * Missing backend fields use non-sensitive presentation fallbacks.
 */
function getInitialProfile(user) {
  const nameParts = user?.name?.split(" ") ?? [];

  return {
    firstName: user?.firstName ?? nameParts[0] ?? "",
    lastName: user?.lastName ?? nameParts.slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? userProfileData.phone,
    role: user?.role ?? "USER",
  };
}

/**
 * Renders one editable profile field with consistent styling and labels.
 */
function ProfileField({ label, name, onChange, type = "text", value }) {
  return (
    <label className="elite-profile-field">
      {label}
      <input name={name} type={type} value={value} onChange={onChange} />
    </label>
  );
}

/**
 * Combines local profile fields into the display name used by the identity
 * panel. The fallback avoids inventing sensitive account information.
 */
function getProfileDisplayName(profile) {
  return (
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "EliteBNB Guest"
  );
}

/**
 * Creates initials for the profile identity mark without depending on an
 * uploaded avatar service that does not exist in the frontend contract yet.
 */
function getProfileInitials(displayName) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Shows a local preference toggle for future account personalization.
 * It updates only component state and does not imply backend persistence.
 */
function PreferenceToggle({ description, enabled, label, onToggle }) {
  return (
    <button
      type="button"
      className={`elite-preference-toggle${enabled ? " is-active" : ""}`}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <i aria-hidden="true" />
    </button>
  );
}

/**
 * Adds one calm, presentation-only recommendation to the account area.
 * It uses existing property-route links and mock display data without claiming
 * a backend recommendation algorithm exists yet.
 */
function ProfileRecommendation({ stay }) {
  return (
    <section className="elite-profile-recommendation" data-user-page-reveal>
      <Link
        to={`/property/${stay.id}`}
        className="elite-profile-recommendation__media"
      >
        <img src={stay.image} alt={stay.imageAlt} loading="lazy" />
        <span aria-hidden="true" />
      </Link>

      <div className="elite-profile-recommendation__content">
        <p className="elite-user-page-header__eyebrow">
          A stay that matches your taste
        </p>
        <p className="elite-profile-recommendation__location">
          <MapPin size={15} aria-hidden="true" />
          {stay.location}
        </p>
        <h3>{stay.name}</h3>
        <p>{stay.descriptor}</p>
        <div className="elite-profile-recommendation__meta">
          <span>
            <Star size={15} fill="currentColor" aria-hidden="true" />
            {stay.rating}
          </span>
          <strong>
            {stay.price}
            <small>{stay.qualifier}</small>
          </strong>
        </div>
        <div className="elite-profile-recommendation__actions">
          <Link to={`/property/${stay.id}`}>
            View stay
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" aria-label={`Save ${stay.name} to wishlist`}>
            <Heart size={16} aria-hidden="true" />
            Save
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Replaces the Profile placeholder with a guest account view.
 * The page keeps edits local until profile-update endpoints are connected and
 * preview mode avoids writing fake identity into AuthContext or localStorage.
 */
export default function UserProfile({ previewMode = false, previewUser }) {
  const { logout, user } = useAuth();
  const {
    avatarOptions,
    selectedAvatar,
    selectedAvatarId,
    setSelectedAvatarId,
  } = useGuestAvatar();
  const navigate = useNavigate();
  const effectiveUser = previewUser ?? user;
  const reviewsPath = previewMode ? "/dev/user-preview/reviews" : "/user/reviews";
  const [profile, setProfile] = useState(() => getInitialProfile(effectiveUser));
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [preferences, setPreferences] = useState(userProfileData.preferences);
  const displayName = getProfileDisplayName(profile);
  const initials = getProfileInitials(displayName) || "EB";
  const heroDetails = [
    { label: "Identity", value: displayName },
    { label: "Account", value: userProfileData.accountRoleLabel },
    { label: "Avatar", value: selectedAvatar.label },
  ];

  /**
   * Updates local form state only. A future service call can consume this same
   * shape once backend profile persistence is available.
   */
  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  /**
   * Toggles one local preference without persisting it to a fake endpoint.
   */
  const handlePreferenceToggle = (preferenceId) => {
    setPreferences((currentPreferences) =>
      currentPreferences.map((preference) =>
        preference.id === preferenceId
          ? { ...preference, enabled: !preference.enabled }
          : preference
      )
    );
  };

  /**
   * Updates the frontend-only illustrated avatar preference.
   * This intentionally stores no JWT, user record, or server-facing profile
   * value; backend avatar persistence can be connected in a future profile pass.
   */
  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatarId(avatarId);
    setIsAvatarPickerOpen(false);
  };

  /**
   * Uses the existing auth logout behavior in production.
   * Preview mode only exits to login so it cannot clear a real token during QA.
   */
  const handleLogout = () => {
    if (!previewMode) {
      logout();
    }

    navigate("/login", { replace: true });
  };

  return (
    <section className="elite-user-page elite-user-profile" data-user-page>
      <UserPageHeader
        eyebrow="Profile"
        tone="identity"
        signature="DOSSIER"
        detailItems={heroDetails}
        title="Your EliteBNB travel identity."
        description="A personal dossier for the details, preferences and account signals that quietly shape better stays."
        action={
          <div className="elite-profile-hero-avatar">
            <GuestAvatar
              avatarId={selectedAvatarId}
              initials={initials}
              label={`${displayName} preview avatar`}
              size="hero"
            />
            <span>
              <strong>{displayName}</strong>
              <small>EliteBNB Guest</small>
            </span>
          </div>
        }
      />

      <section className="elite-profile-identity" data-user-page-reveal>
        <div className="elite-profile-identity__avatar-stack">
          <GuestAvatar
            avatarId={selectedAvatarId}
            initials={initials}
            label={`${displayName} profile avatar`}
            size="hero"
          />
          <button
            type="button"
            className="elite-avatar-picker__trigger"
            aria-expanded={isAvatarPickerOpen}
            aria-controls="elite-profile-avatar-options"
            onClick={() => setIsAvatarPickerOpen((isOpen) => !isOpen)}
          >
            Change avatar
          </button>

          {isAvatarPickerOpen ? (
            <div
              className="elite-avatar-picker__grid"
              id="elite-profile-avatar-options"
              aria-label="Choose a preview avatar"
            >
              {avatarOptions.map((avatar) => (
                <button
                  type="button"
                  className={
                    avatar.id === selectedAvatarId ? "is-selected" : ""
                  }
                  key={avatar.id}
                  aria-pressed={avatar.id === selectedAvatarId}
                  onClick={() => handleAvatarSelect(avatar.id)}
                >
                  <GuestAvatar
                    avatarId={avatar.id}
                    initials={initials}
                    size="option"
                  />
                  <span>{avatar.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          <p className="elite-avatar-picker__note">
            Frontend preview only. Account avatars will need backend support.
          </p>
        </div>
        <div className="elite-profile-identity__copy">
          <p className="elite-user-page-header__eyebrow">Guest profile</p>
          <h3>{displayName}</h3>
          <p>
            {profile.role === "HOST"
              ? "Host-capable account with guest discovery still available."
              : "Private guest account prepared for considered stays."}
          </p>
        </div>
        <dl className="elite-profile-identity__details">
          <div>
            <dt>
              <Mail size={14} aria-hidden="true" />
              Email
            </dt>
            <dd>{profile.email || "Not added yet"}</dd>
          </div>
          <div>
            <dt>
              <Phone size={14} aria-hidden="true" />
              Phone
            </dt>
            <dd>{profile.phone || "Not added yet"}</dd>
          </div>
        </dl>
        <dl
          className="elite-profile-identity__stats"
          aria-label="Preview guest travel identity summary"
        >
          {userProfileData.identityStats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          className="elite-user-page__primary-button"
          onClick={() => setIsEditingProfile((isEditing) => !isEditing)}
        >
          <PenLine size={15} aria-hidden="true" />
          {isEditingProfile ? "Close editor" : "Edit profile"}
        </button>
      </section>

      <div className="elite-profile-layout">
        <section className="elite-user-page__surface" data-user-page-reveal>
          <div className="elite-profile-card__heading">
            <span>
              <UserRound size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="elite-user-section-heading__eyebrow">
                Personal profile
              </p>
              <h3>{isEditingProfile ? "Edit guest details" : "Account snapshot"}</h3>
            </div>
          </div>

          {isEditingProfile ? (
            <form className="elite-profile-form">
              <div className="elite-profile-form__grid">
                <ProfileField
                  label="First name"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                />
                <ProfileField
                  label="Last name"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                />
                <ProfileField
                  label="Email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                />
                <ProfileField
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleProfileChange}
                />
              </div>

              <label className="elite-profile-field">
                Account role
                <input value={profile.role} readOnly />
              </label>

              <button type="button" className="elite-user-page__primary-button">
                Save profile draft
              </button>
            </form>
          ) : (
            <div className="elite-profile-summary">
              <p>
                Your account details stay ready for booking flows while final
                profile persistence waits for backend integration.
              </p>
              <dl>
                <div>
                  <dt>Account role</dt>
                  <dd>{userProfileData.accountRoleLabel}</dd>
                </div>
                <div>
                  <dt>Preferred tone</dt>
                  <dd>Waterfront, quiet arrival, design-led stays</dd>
                </div>
                <div>
                  <dt>Profile status</dt>
                  <dd>Preview-ready</dd>
                </div>
              </dl>
            </div>
          )}
        </section>

        <aside className="elite-profile-side">
          <section className="elite-user-page__surface" data-user-page-reveal>
            <div className="elite-profile-card__heading">
              <span>
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="elite-user-section-heading__eyebrow">
                  Preferences
                </p>
                <h3>How you like to stay</h3>
              </div>
            </div>

            <div className="elite-profile-preferences">
              {preferences.map((preference) => (
                <PreferenceToggle
                  key={preference.id}
                  description={preference.description}
                  enabled={preference.enabled}
                  label={preference.label}
                  onToggle={() => handlePreferenceToggle(preference.id)}
                />
              ))}
            </div>
          </section>

          <section className="elite-user-page__surface" data-user-page-reveal>
            <div className="elite-profile-card__heading">
              <span>
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="elite-user-section-heading__eyebrow">
                  Account access
                </p>
                <h3>Security</h3>
              </div>
            </div>
            <ul className="elite-profile-security">
              {userProfileData.securityItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to={reviewsPath} className="elite-profile-review-link">
              View your reviews
            </Link>
            <button
              type="button"
              className="elite-profile-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </section>
        </aside>
      </div>

      <ProfileRecommendation stay={userProfileData.recommendedStay} />
    </section>
  );
}
