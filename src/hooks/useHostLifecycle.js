import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { hostOnboardingService } from "../services/hostOnboardingService";
import { hostProfileService } from "../services/hostProfileService";
import { hostVerificationService } from "../services/hostVerificationService";

export const HOST_LIFECYCLE_STATES = {
  LOADING: "LOADING",
  PROFILE_INCOMPLETE: "PROFILE_INCOMPLETE",
  READY_TO_SUBMIT: "READY_TO_SUBMIT",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  VERIFIED: "VERIFIED",
};

const initialLifecycleState = {
  error: "",
  lifecycleState: HOST_LIFECYCLE_STATES.LOADING,
  loading: true,
  onboarding: null,
  prerequisites: [],
  profile: null,
  verification: null,
  verificationMissing: false,
};

/**
 * Normalizes conventional API wrappers without fabricating lifecycle data. Host
 * profile/onboarding/verification are all trusted only after the backend
 * returns them for the authenticated Host.
 */
function unwrapResponseData(response) {
  return response?.data?.data ?? response?.data?.profile ?? response?.data ?? null;
}

/**
 * The Host verification endpoint can legitimately respond with no record before
 * the Host has submitted. Treat only no-record style responses as a lifecycle
 * state; other failures remain real errors.
 */
function isNoVerificationRecordError(error) {
  const status = error?.response?.status;
  const message = String(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data ||
      "",
  ).toLowerCase();

  return (
    status === 404 ||
    message.includes("no verification") ||
    message.includes("verification not found") ||
    message.includes("not submitted")
  );
}

/**
 * Returns the most useful host-facing message from an API failure without
 * exposing backend internals.
 */
function getLifecycleErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === "string" ? error.response.data : "") ||
    "We couldn't check your Host verification status right now."
  );
}

/**
 * Verifies that required profile/onboarding fields are nonblank. The frontend
 * uses this for guidance only; the backend still owns verification eligibility
 * and may reject submissions if server-side requirements are not met.
 */
function hasValue(value) {
  if (typeof value === "string") return value.trim().length > 0;

  return Boolean(value);
}

/**
 * Reads the first real backend/session value without treating explicit `false`
 * as missing. Host lifecycle flags can arrive from different authenticated DTOs,
 * so nullish checks are safer than `||` for boolean-like fields.
 */
function firstPresentValue(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

/**
 * Normalizes boolean lifecycle flags from existing backend/session data. Some
 * DTOs serialize flags as strings, and the verification checklist should not
 * mark an already verified Host as incomplete because `"true" !== true`.
 */
function normalizeBooleanFlag(value) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }

  if (typeof value === "number") return value === 1;

  return false;
}

/**
 * Builds one combined Host record from profile, onboarding, and AuthContext.
 * Existing endpoints split identity and address fields, so the lifecycle page
 * needs this combined view to explain what is still missing.
 */
function getCombinedHost(profile, onboarding, currentUser) {
  /*
   * Email verification belongs to the authenticated account identity. Prefer
   * AuthContext when it already has that backend session field, then fall back
   * to freshly loaded Host DTOs that may expose the same flag on refresh.
   */
  const emailVerified = normalizeBooleanFlag(
    firstPresentValue(
      currentUser?.emailVerified,
      profile?.emailVerified,
      onboarding?.emailVerified,
    ),
  );
  const hostOnboardingCompleted = normalizeBooleanFlag(
    firstPresentValue(
      onboarding?.hostOnboardingCompleted,
      profile?.hostOnboardingCompleted,
      currentUser?.hostOnboardingCompleted,
    ),
  );

  return {
    ...currentUser,
    ...profile,
    emailVerified,
    phoneNumber:
      profile?.phoneNumber || onboarding?.phoneNumber || currentUser?.phoneNumber,
    address: onboarding?.address || profile?.address || currentUser?.address,
    city: onboarding?.city || profile?.city || currentUser?.city,
    state: onboarding?.state || profile?.state || currentUser?.state,
    country: onboarding?.country || profile?.country || currentUser?.country,
    hostOnboardingCompleted,
  };
}

/**
 * Produces the checklist shown to unverified Hosts. Items are phrased as real
 * prerequisites from the backend contract, not as frontend-only security rules.
 */
export function getHostLifecyclePrerequisites(profile, onboarding, currentUser) {
  const combinedHost = getCombinedHost(profile, onboarding, currentUser);
  const items = [
    {
      complete: combinedHost.emailVerified,
      key: "emailVerified",
      label: "Email verified",
      route: `/verify-email?email=${encodeURIComponent(combinedHost.email || "")}`,
    },
    {
      complete: hasValue(combinedHost.firstName) && hasValue(combinedHost.lastName),
      key: "identity",
      label: "First and last name",
      route: "/host/profile",
    },
    {
      complete: hasValue(combinedHost.email),
      key: "email",
      label: "Email address",
      route: "/host/profile",
    },
    {
      complete: hasValue(combinedHost.phoneNumber),
      key: "phoneNumber",
      label: "Phone number",
      route: "/host/profile",
    },
    {
      complete:
        hasValue(combinedHost.address) &&
        hasValue(combinedHost.city) &&
        hasValue(combinedHost.state) &&
        hasValue(combinedHost.country),
      key: "address",
      label: "Residential address",
      route: "/host/onboarding",
    },
    {
      complete: hasValue(combinedHost.profileImageUrl),
      key: "profileImageUrl",
      label: "Profile photo",
      route: "/host/profile",
    },
    {
      complete: combinedHost.hostOnboardingCompleted,
      key: "hostOnboardingCompleted",
      label: "Host onboarding completed",
      route: "/host/onboarding",
    },
  ];

  return {
    combinedHost,
    complete: items.every((item) => item.complete),
    items,
    missingItems: items.filter((item) => !item.complete),
  };
}

/**
 * Converts profile/onboarding/verification data into the finite Host lifecycle
 * state used by routing and the restricted Host experience.
 */
export function deriveHostLifecycle({
  currentUser,
  onboarding,
  profile,
  verification,
  verificationMissing,
}) {
  const prerequisites = getHostLifecyclePrerequisites(
    profile,
    onboarding,
    currentUser,
  );
  const verificationStatus = String(verification?.status || "").toUpperCase();

  /*
   * VERIFIED is allowed to win even if an older profile DTO omits a prerequisite
   * field. Backend business APIs still enforce true access on every request.
   */
  if (verificationStatus === "VERIFIED") {
    return {
      lifecycleState: HOST_LIFECYCLE_STATES.VERIFIED,
      prerequisites,
    };
  }

  if (verificationStatus === "PENDING") {
    return {
      lifecycleState: HOST_LIFECYCLE_STATES.PENDING,
      prerequisites,
    };
  }

  if (verificationStatus === "REJECTED") {
    return {
      lifecycleState: HOST_LIFECYCLE_STATES.REJECTED,
      prerequisites,
    };
  }

  if (!prerequisites.complete) {
    return {
      lifecycleState: HOST_LIFECYCLE_STATES.PROFILE_INCOMPLETE,
      prerequisites,
    };
  }

  if (verificationMissing || !verificationStatus) {
    return {
      lifecycleState: HOST_LIFECYCLE_STATES.READY_TO_SUBMIT,
      prerequisites,
    };
  }

  return {
    lifecycleState: HOST_LIFECYCLE_STATES.PROFILE_INCOMPLETE,
    prerequisites,
  };
}

/**
 * Loads the Host lifecycle once for route gating or lifecycle presentation.
 * Keeping this in a hook prevents every Host business page from duplicating
 * profile/onboarding/verification calls and makes cleanup predictable.
 */
export function useHostLifecycle({ enabled = true } = {}) {
  const { user } = useAuth();
  const [state, setState] = useState(initialLifecycleState);

  const refreshLifecycle = useCallback(async () => {
    if (!enabled) {
      setState({
        ...initialLifecycleState,
        loading: false,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      error: "",
      lifecycleState: HOST_LIFECYCLE_STATES.LOADING,
      loading: true,
    }));

    try {
      const [profileResponse, onboardingResponse] = await Promise.all([
        hostProfileService.getProfile(),
        hostOnboardingService.get(),
      ]);
      const profile = unwrapResponseData(profileResponse);
      const onboarding = unwrapResponseData(onboardingResponse);
      let verification = null;
      let verificationMissing = false;

      try {
        const verificationResponse = await hostVerificationService.get();
        verification =
          verificationResponse.data?.verification ??
          verificationResponse.data?.data ??
          verificationResponse.data;
      } catch (verificationError) {
        if (isNoVerificationRecordError(verificationError)) {
          verificationMissing = true;
        } else {
          throw verificationError;
        }
      }

      const derived = deriveHostLifecycle({
        currentUser: user,
        onboarding,
        profile,
        verification,
        verificationMissing,
      });

      setState({
        error: "",
        lifecycleState: derived.lifecycleState,
        loading: false,
        onboarding,
        prerequisites: derived.prerequisites.items,
        profile,
        verification,
        verificationMissing,
      });
    } catch (error) {
      setState({
        ...initialLifecycleState,
        error: getLifecycleErrorMessage(error),
        lifecycleState: HOST_LIFECYCLE_STATES.PROFILE_INCOMPLETE,
        loading: false,
      });
    }
  }, [enabled, user]);

  useEffect(() => {
    let active = true;

    window.queueMicrotask(() => {
      if (active) refreshLifecycle();
    });

    return () => {
      active = false;
    };
  }, [refreshLifecycle]);

  return {
    ...state,
    isVerified: state.lifecycleState === HOST_LIFECYCLE_STATES.VERIFIED,
    refreshLifecycle,
  };
}
