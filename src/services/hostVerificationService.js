import api from "./api";

/**
 * Host verification API boundary.
 * The shared Axios client already prefixes `/api`, so these methods mirror the
 * existing Host verification controller paths without inventing a separate
 * document-upload or status endpoint.
 */
export const hostVerificationService = {
  /**
   * Reads the authenticated Host's verification record. A 404/no-record
   * response is interpreted by the lifecycle hook as "not submitted yet" rather
   * than as a fatal application error.
   */
  get: () => api.get("/host/verification"),

  /**
   * Submits or resubmits the backend-supported verification payload. The backend
   * remains responsible for profile prerequisites and status transitions.
   */
  submit: (payload) => api.post("/host/verification", payload),
};
