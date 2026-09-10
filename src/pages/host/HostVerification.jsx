import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Home,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HostSupportDrawer from "../../components/host/HostSupportDrawer";
import EliteLogo from "../../components/public/EliteLogo";
import { useAuth } from "../../hooks/useAuth";
import {
  HOST_LIFECYCLE_STATES,
  useHostLifecycle,
} from "../../hooks/useHostLifecycle";
import { hostVerificationService } from "../../services/hostVerificationService";
import "./HostVerification.css";

const emptyVerificationForm = {
  businessName: "",
  documentType: "",
  documentUrl: "",
  legalName: "",
};

/**
 * Converts backend enum/string values into readable copy without changing the
 * raw values used in comparisons and API requests.
 */
function formatValue(value) {
  if (!value) return "Not provided";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Formats backend timestamps defensively because verification records can be
 * absent or partially populated before Admin review.
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
 * Builds a display name from genuine profile/AuthContext fields. If the
 * backend does not return a name yet, the UI uses a neutral Host fallback.
 */
function getDisplayName(profile) {
  return (
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.name ||
    profile?.email ||
    "EliteBNB Host"
  );
}

/**
 * Creates a safe browser href for document URLs returned or entered through the
 * backend-supported verification payload. Raw URLs are not printed in the UI.
 */
function getDocumentHref(documentUrl) {
  if (!documentUrl) return "";
  if (/^(https?:\/\/|\/)/i.test(documentUrl)) return documentUrl;

  return "";
}

/**
 * Pulls backend submission errors into copy that is safe to show near the Host
 * verification form.
 */
function getSubmitErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === "string" ? error.response.data : "") ||
    "We couldn't submit your verification request."
  );
}

/**
 * Builds the initial verification draft from a rejected record or from the real
 * Host identity. No legal/business/document values are invented locally.
 */
function createVerificationDraft(lifecycle) {
  const profile = lifecycle.profile || {};
  const verification = lifecycle.verification || {};

  return {
    businessName: verification.businessName || "",
    documentType: verification.documentType || "",
    documentUrl: verification.documentUrl || "",
    legalName:
      verification.legalName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" "),
  };
}

/**
 * Derives copy and tone for the lifecycle masthead. This keeps route guards and
 * page presentation aligned around the same finite states.
 */
function getLifecyclePresentation(lifecycleState) {
  if (lifecycleState === HOST_LIFECYCLE_STATES.PROFILE_INCOMPLETE) {
    return {
      icon: "profile",
      kicker: "Profile required",
      title: "Complete your Host profile",
      tone: "attention",
      summary:
        "EliteBNB needs your verified identity, profile photo, and address details before you can submit for Host verification.",
    };
  }

  if (lifecycleState === HOST_LIFECYCLE_STATES.READY_TO_SUBMIT) {
    return {
      icon: "ready",
      kicker: "Ready for review",
      title: "Ready for verification",
      tone: "ready",
      summary:
        "Your profile requirements are complete. Submit the verification details supported by the Host verification backend.",
    };
  }

  if (lifecycleState === HOST_LIFECYCLE_STATES.PENDING) {
    return {
      icon: "pending",
      kicker: "Admin review",
      title: "Verification pending",
      tone: "pending",
      summary:
        "Your request has been submitted. Host business tools unlock only after Admin approval.",
    };
  }

  if (lifecycleState === HOST_LIFECYCLE_STATES.REJECTED) {
    return {
      icon: "rejected",
      kicker: "Needs attention",
      title: "Verification needs attention",
      tone: "rejected",
      summary:
        "Review the Admin note, update any relevant Host information, and resubmit when your details are ready.",
    };
  }

  if (lifecycleState === HOST_LIFECYCLE_STATES.VERIFIED) {
    return {
      icon: "verified",
      kicker: "Hosting unlocked",
      title: "Verified Host access",
      tone: "verified",
      summary:
        "Your Host verification is approved. Your normal EliteBNB Host workspace remains available.",
    };
  }

  return {
    icon: "pending",
    kicker: "Checking status",
    title: "Reviewing your Host lifecycle",
    tone: "pending",
    summary: "We are checking your Host profile and verification status.",
  };
}

/**
 * Static icon branches avoid dynamic component construction while keeping the
 * lifecycle state visually expressive.
 */
function LifecycleIcon({ icon }) {
  if (icon === "profile") return <UserRound size={30} aria-hidden="true" />;
  if (icon === "ready") return <FileText size={30} aria-hidden="true" />;
  if (icon === "rejected") return <XCircle size={30} aria-hidden="true" />;
  if (icon === "verified") return <ShieldCheck size={30} aria-hidden="true" />;

  return <Clock3 size={30} aria-hidden="true" />;
}

/**
 * Shows one genuine prerequisite from profile/onboarding state. The text label
 * carries the meaning so completion is not communicated by color alone.
 */
function PrerequisiteItem({ item }) {
  return (
    <li className={item.complete ? "is-complete" : "is-missing"}>
      {item.complete ? (
        <CheckCircle2 size={17} aria-hidden="true" />
      ) : (
        <AlertCircle size={17} aria-hidden="true" />
      )}
      <span>{item.label}</span>
      <strong>{item.complete ? "Complete" : "Needs attention"}</strong>
    </li>
  );
}

/**
 * The lifecycle progress rail explains what unlocks verified hosting without
 * pretending these frontend checks replace backend authorization.
 */
function LifecycleProgress({ lifecycleState, prerequisites }) {
  const prerequisiteComplete = prerequisites.every((item) => item.complete);
  const steps = [
    {
      complete: prerequisiteComplete,
      label: "Profile ready",
    },
    {
      complete:
        lifecycleState === HOST_LIFECYCLE_STATES.PENDING ||
        lifecycleState === HOST_LIFECYCLE_STATES.REJECTED ||
        lifecycleState === HOST_LIFECYCLE_STATES.VERIFIED,
      label: "Verification submitted",
    },
    {
      complete: lifecycleState === HOST_LIFECYCLE_STATES.VERIFIED,
      label: "Hosting unlocked",
    },
  ];

  return (
    <ol className="elite-host-verification__progress">
      {steps.map((step) => (
        <li key={step.label} className={step.complete ? "is-complete" : ""}>
          <span aria-hidden="true" />
          {step.label}
        </li>
      ))}
    </ol>
  );
}

/**
 * Presents backend-returned verification metadata without displaying raw
 * document URLs as unattractive text or adding fake review estimates.
 */
function VerificationSummary({ onContactSupport, verification }) {
  if (!verification) return null;

  const documentHref = getDocumentHref(verification.documentUrl);

  return (
    <section className="elite-host-verification__summary-panel">
      <span className="elite-host-verification__eyebrow">Submission details</span>
      <div className="elite-host-verification__detail-grid">
        <DetailItem label="Status" value={formatValue(verification.status)} />
        <DetailItem label="Legal name" value={verification.legalName} />
        <DetailItem label="Business name" value={verification.businessName} />
        <DetailItem label="Document type" value={verification.documentType} />
        <DetailItem label="Submitted" value={formatDateTime(verification.createdAt)} />
        <DetailItem label="Updated" value={formatDateTime(verification.updatedAt)} />
      </div>

      {verification.adminNote ? (
        <div className="elite-host-verification__admin-note">
          <strong>Admin note</strong>
          <p>{verification.adminNote}</p>
          {onContactSupport ? (
            <button
              className="elite-host-verification__support-action"
              onClick={onContactSupport}
              type="button"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Contact EliteBNB Support
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="elite-host-verification__document-card">
        <FileText size={22} aria-hidden="true" />
        <div>
          <h3>{verification.documentType || "Verification document"}</h3>
          <p>
            {documentHref
              ? "Open the document you submitted for Admin review."
              : "No browser-openable document link was returned."}
          </p>
        </div>
        {documentHref ? (
          <a href={documentHref} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={15} aria-hidden="true" />
            Open document
          </a>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Compact detail item for genuine backend/profile values. Missing values are
 * presented neutrally rather than filled with fake profile data.
 */
function DetailItem({ label, value }) {
  return (
    <div className="elite-host-verification__detail-item">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

/**
 * Guides incomplete Hosts back to the existing profile and onboarding flows
 * instead of duplicating those forms inside the lifecycle screen.
 */
function ProfileIncompletePanel({ prerequisites }) {
  const firstMissingRoute =
    prerequisites.find((item) => !item.complete)?.route || "/host/profile";

  return (
    <section className="elite-host-verification__panel">
      <div>
        <span className="elite-host-verification__eyebrow">What remains</span>
        <h2>Complete these details before verification</h2>
        <p>
          These checklist items come from your current Host profile and onboarding
          data. The backend will still validate eligibility when you submit.
        </p>
      </div>

      <ul className="elite-host-verification__checklist">
        {prerequisites.map((item) => (
          <PrerequisiteItem key={item.key} item={item} />
        ))}
      </ul>

      <div className="elite-host-verification__actions">
        <Link className="elite-host-verification__primary-action" to={firstMissingRoute}>
          Continue setup
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link className="elite-host-verification__secondary-action" to="/host/profile">
          Review profile
        </Link>
        <Link className="elite-host-verification__secondary-action" to="/host/onboarding">
          Review onboarding
        </Link>
      </div>
    </section>
  );
}

/**
 * Renders the backend-supported Host verification submission form. The frontend
 * sends legalName, businessName, documentType, and documentUrl only; it does
 * not invent upload endpoints or extra document metadata.
 */
function VerificationForm({
  form,
  lifecycleState,
  onChange,
  onSubmit,
  submitError,
  submitSuccess,
  submitting,
  verification,
}) {
  const isRejected = lifecycleState === HOST_LIFECYCLE_STATES.REJECTED;

  return (
    <form className="elite-host-verification__form" onSubmit={onSubmit}>
      <div>
        <span className="elite-host-verification__eyebrow">
          {isRejected ? "Resubmit verification" : "Submit verification"}
        </span>
        <h2>{isRejected ? "Send an updated request" : "Verification details"}</h2>
        <p>
          Enter only the identity and document fields supported by the Host
          verification backend. Admin review begins after submission.
        </p>
      </div>

      {verification?.adminNote && isRejected ? (
        <div className="elite-host-verification__admin-note is-rejected">
          <strong>Admin note</strong>
          <p>{verification.adminNote}</p>
        </div>
      ) : null}

      <div className="elite-host-verification__form-grid">
        <label>
          <span>Legal name</span>
          <input
            name="legalName"
            value={form.legalName}
            onChange={onChange}
            placeholder="Name exactly as it appears on your document"
            required
          />
        </label>

        <label>
          <span>Business name</span>
          <input
            name="businessName"
            value={form.businessName}
            onChange={onChange}
            placeholder="Optional business or trading name"
          />
        </label>

        <label>
          <span>Document type</span>
          <input
            name="documentType"
            value={form.documentType}
            onChange={onChange}
            placeholder="e.g. government ID or business registration"
            required
          />
        </label>

        <label>
          <span>Document link</span>
          <input
            name="documentUrl"
            type="url"
            value={form.documentUrl}
            onChange={onChange}
            placeholder="https://..."
            required
          />
        </label>
      </div>

      {submitError ? (
        <p className="elite-host-verification__message is-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p className="elite-host-verification__message is-success" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          {submitSuccess}
        </p>
      ) : null}

      <button
        className="elite-host-verification__primary-action"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <Loader2 size={16} aria-hidden="true" />
        ) : (
          <ShieldCheck size={16} aria-hidden="true" />
        )}
        {submitting ? "Submitting..." : isRejected ? "Resubmit verification" : "Submit verification"}
      </button>
    </form>
  );
}

/**
 * Host verification lifecycle page.
 * This restricted experience gives unverified Hosts a clear path without
 * changing backend security or showing normal business tools before approval.
 */
export default function HostVerification() {
  const auth = useAuth();
  const navigate = useNavigate();
  const lifecycle = useHostLifecycle();
  const presentation = getLifecyclePresentation(lifecycle.lifecycleState);
  const displayName = getDisplayName(lifecycle.profile || auth.user);
  const [form, setForm] = useState(emptyVerificationForm);
  const [formSourceKey, setFormSourceKey] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formSeedKey = useMemo(
    () =>
      `${lifecycle.lifecycleState}:${lifecycle.verification?.id || "new"}:${
        lifecycle.profile?.id || auth.user?.id || "host"
      }`,
    [auth.user?.id, lifecycle.lifecycleState, lifecycle.profile?.id, lifecycle.verification?.id],
  );

  /**
   * Prefills the submission form when the lifecycle record changes. The source
   * key prevents background refreshes from erasing an Admin's in-progress edits
   * on the same lifecycle record.
   */
  useEffect(() => {
    if (lifecycle.loading || formSourceKey === formSeedKey) return;

    let active = true;

    window.queueMicrotask(() => {
      if (!active) return;

      setForm(createVerificationDraft(lifecycle));
      setFormSourceKey(formSeedKey);
      setSubmitError("");
      setSubmitSuccess("");
    });

    return () => {
      active = false;
    };
  }, [formSeedKey, formSourceKey, lifecycle]);

  /**
   * Keeps verification inputs controlled and clears stale mutation feedback as
   * soon as the Host edits the pending payload.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setSubmitError("");
    setSubmitSuccess("");
  }

  /**
   * Submits or resubmits the Host verification request. Backend validation is
   * authoritative for profile prerequisites and resubmission behavior.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.legalName.trim()) {
      setSubmitError("Enter your legal name before submitting.");
      return;
    }

    if (!form.documentType.trim()) {
      setSubmitError("Enter the document type before submitting.");
      return;
    }

    if (!form.documentUrl.trim()) {
      setSubmitError("Add a document link before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      await hostVerificationService.submit({
        businessName: form.businessName.trim(),
        documentType: form.documentType.trim(),
        documentUrl: form.documentUrl.trim(),
        legalName: form.legalName.trim(),
      });

      setSubmitSuccess("Verification submitted for Admin review.");
      await lifecycle.refreshLifecycle();
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Uses the existing AuthContext logout path, then returns to login without
   * touching token storage directly from this page.
   */
  async function handleLogout() {
    await auth.logout();
    navigate("/login");
  }

  if (lifecycle.loading) {
    return (
      <main className="elite-host-verification">
        <section className="elite-host-verification__loading" role="status">
          <Loader2 size={34} aria-hidden="true" />
          <p>Checking your Host verification status...</p>
        </section>
      </main>
    );
  }

  if (lifecycle.error) {
    return (
      <main className="elite-host-verification">
        <section className="elite-host-verification__loading is-error" role="alert">
          <AlertCircle size={34} aria-hidden="true" />
          <h1>We could not load your Host lifecycle.</h1>
          <p>{lifecycle.error}</p>
          <button type="button" onClick={lifecycle.refreshLifecycle}>
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="elite-host-verification">
      <header className="elite-host-verification__topbar">
        <Link
          aria-label="EliteBNB home"
          className="elite-host-verification__brand"
          to="/"
        >
          <EliteLogo variant="primary" label="EliteBNB" />
        </Link>
        <nav aria-label="Host verification navigation">
          <Link to="/host/profile">Profile</Link>
          <Link to="/host/onboarding">Onboarding</Link>
          <button type="button" onClick={handleLogout}>
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </nav>
      </header>

      <section className={`elite-host-verification__hero is-${presentation.tone}`}>
        <div className="elite-host-verification__hero-copy">
          <span className="elite-host-verification__eyebrow">
            Host verification lifecycle
          </span>
          <h1>{presentation.title}</h1>
          <p>{presentation.summary}</p>
          <div className="elite-host-verification__host-chip">
            <span>{displayName.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{displayName}</strong>
              <small>{lifecycle.profile?.email || auth.user?.email || "Host account"}</small>
            </div>
          </div>
        </div>

        <aside className="elite-host-verification__status-card">
          <span className="elite-host-verification__status-icon">
            <LifecycleIcon icon={presentation.icon} />
          </span>
          <strong>{presentation.kicker}</strong>
          <p>
            Business tools are available only after backend-confirmed VERIFIED
            Host status.
          </p>
          <LifecycleProgress
            lifecycleState={lifecycle.lifecycleState}
            prerequisites={lifecycle.prerequisites}
          />
          <button
            className="elite-host-verification__support-action"
            onClick={() => setSupportOpen(true)}
            type="button"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Contact EliteBNB Support
          </button>
        </aside>
      </section>

      {lifecycle.lifecycleState === HOST_LIFECYCLE_STATES.PROFILE_INCOMPLETE ? (
        <ProfileIncompletePanel prerequisites={lifecycle.prerequisites} />
      ) : null}

      {lifecycle.lifecycleState === HOST_LIFECYCLE_STATES.READY_TO_SUBMIT ||
      lifecycle.lifecycleState === HOST_LIFECYCLE_STATES.REJECTED ? (
        <section className="elite-host-verification__content-grid">
          <VerificationForm
            form={form}
            lifecycleState={lifecycle.lifecycleState}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitError={submitError}
            submitSuccess={submitSuccess}
            submitting={submitting}
            verification={lifecycle.verification}
          />
          <VerificationSummary
            onContactSupport={() => setSupportOpen(true)}
            verification={lifecycle.verification}
          />
        </section>
      ) : null}

      {lifecycle.lifecycleState === HOST_LIFECYCLE_STATES.PENDING ? (
        <section className="elite-host-verification__content-grid">
          <section className="elite-host-verification__panel">
            <span className="elite-host-verification__eyebrow">Admin review</span>
            <h2>Your submission is pending</h2>
            <p>
              EliteBNB Admin will review the submitted verification record.
              Until it is VERIFIED, dashboard, listings, reservations, earnings,
              and other Host business tools remain unavailable.
            </p>
          </section>
          <VerificationSummary
            onContactSupport={() => setSupportOpen(true)}
            verification={lifecycle.verification}
          />
        </section>
      ) : null}

      {lifecycle.lifecycleState === HOST_LIFECYCLE_STATES.VERIFIED ? (
        <section className="elite-host-verification__panel">
          <span className="elite-host-verification__eyebrow">Verified Host</span>
          <h2>Your Host workspace is unlocked</h2>
          <p>
            You can continue to your Host dashboard and manage listings,
            reservations, messages, and earnings through the existing Host tools.
          </p>
          <div className="elite-host-verification__actions">
            <Link className="elite-host-verification__primary-action" to="/host/dashboard">
              Go to dashboard
              <Home size={16} aria-hidden="true" />
            </Link>
            <Link className="elite-host-verification__secondary-action" to="/host/profile">
              Review profile
            </Link>
          </div>
        </section>
      ) : null}

      <HostSupportDrawer
        hostName={displayName}
        onClose={() => setSupportOpen(false)}
        open={supportOpen}
      />
    </main>
  );
}
