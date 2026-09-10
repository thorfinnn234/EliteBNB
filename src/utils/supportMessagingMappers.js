/**
 * Shared presentation constants for Host/Admin support messaging. The backend
 * accepts `body`, and the UI caps length locally to prevent accidental oversized
 * submissions while leaving server validation authoritative.
 */
export const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

/**
 * Returns an array from finalized or conventional collection envelopes. This is
 * used only to read backend-returned support conversations/messages; it never
 * inserts mock records when the response is empty.
 */
export function normalizeSupportList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.conversations)) return payload.conversations;
  if (Array.isArray(payload?.hostSupportConversations)) {
    return payload.hostSupportConversations;
  }
  if (Array.isArray(payload?.messages)) return payload.messages;

  return [];
}

/**
 * Pulls the conversation and message array from the support-thread response.
 * The C1 backend contract defines the resource shape, while this normalizer
 * tolerates common response wrappers already used elsewhere in the frontend.
 */
export function normalizeSupportConversationPayload(payload) {
  const root = payload?.data ?? payload ?? {};
  const conversation =
    root.conversation ??
    root.hostSupportConversation ??
    root.supportConversation ??
    root;
  const messages = normalizeSupportList(
    root.messages ?? conversation?.messages ?? root.supportMessages
  );

  return {
    conversation,
    messages,
  };
}

/**
 * Extracts a conversation id from backend DTO variants without manufacturing a
 * route id. If no real id exists, callers should show an error instead of
 * navigating to a guessed support thread.
 */
export function getSupportConversationId(conversation) {
  return (
    conversation?.id ??
    conversation?.conversationId ??
    conversation?.supportConversationId ??
    conversation?.hostSupportConversationId
  );
}

/**
 * Converts enum-like backend strings to readable labels for support metadata.
 * The raw enum is preserved for API requests and comparisons elsewhere.
 */
export function formatSupportEnum(value, fallback = "Not recorded") {
  if (!value) return fallback;

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Formats support timestamps defensively because inbox summaries and messages
 * can arrive with nullable activity fields.
 */
export function formatSupportDateTime(value) {
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
 * Provides a compact time label for message bubbles without pretending the
 * backend supplied delivery/read timestamps beyond created/sent time.
 */
export function formatSupportMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

/**
 * Reads support message body text from the backend DTO. Empty bodies are shown
 * honestly instead of replaced with fake support content.
 */
export function getSupportMessageBody(message) {
  return message?.body || "";
}

/**
 * Reads the sender role used to distinguish Admin messages from Host messages.
 * Existing EliteBNB messaging DTOs already use senderRole, and fallback names
 * are included only for conventional wrappers, not for business logic.
 */
export function getSupportMessageSenderRole(message) {
  return String(
    message?.senderRole ||
      message?.senderType ||
      message?.role ||
      message?.sender ||
      ""
  ).toUpperCase();
}

/**
 * Reads the sender name when the backend includes it. If omitted, callers can
 * fall back to contextual labels such as "You" or "EliteBNB Support".
 */
export function getSupportMessageSenderName(message) {
  return message?.senderName || message?.authorName || message?.createdByName || "";
}

/**
 * Pulls host identity from Admin support summaries/details. These values come
 * from the C1 support DTO and are presented as unavailable when absent.
 */
export function getSupportHostName(conversation) {
  return (
    conversation?.hostName ||
    conversation?.hostFullName ||
    conversation?.host?.name ||
    conversation?.host?.fullName ||
    "Host"
  );
}

/**
 * Reads the Host email from support summary/detail DTOs without inventing
 * contact information.
 */
export function getSupportHostEmail(conversation) {
  return conversation?.hostEmail || conversation?.host?.email || "";
}

/**
 * Reads the Host id used by the Admin create-or-get endpoint and support
 * metadata. Missing ids stay blank because C1 does not require fake references.
 */
export function getSupportHostId(conversation) {
  return conversation?.hostId ?? conversation?.host?.id ?? "";
}

/**
 * Reads verification status from support conversation summaries when returned.
 * The support inbox displays it as context only; it does not make verification
 * access decisions.
 */
export function getSupportVerificationStatus(conversation) {
  return (
    conversation?.verificationStatus ||
    conversation?.hostVerificationStatus ||
    conversation?.host?.verificationStatus ||
    ""
  );
}

/**
 * Reads the newest message preview from support summaries. If the backend only
 * returns a nested lastMessage object, the body from that object is used.
 */
export function getSupportLastMessagePreview(conversation) {
  return (
    conversation?.lastMessagePreview ||
    conversation?.lastMessageBody ||
    conversation?.lastMessage?.body ||
    (typeof conversation?.lastMessage === "string"
      ? conversation.lastMessage
      : "") ||
    ""
  );
}

/**
 * Reads the latest activity timestamp for Admin inbox ordering context. The UI
 * does not sort or paginate because C1 does not define those controls.
 */
export function getSupportLastActivityAt(conversation) {
  return (
    conversation?.lastMessageAt ||
    conversation?.lastActivityAt ||
    conversation?.updatedAt ||
    conversation?.createdAt ||
    conversation?.lastMessage?.createdAt ||
    ""
  );
}

/**
 * Reads the Admin unread count from C1 support summaries. Only positive
 * backend-returned numbers produce an unread indicator.
 */
export function getAdminSupportUnreadCount(conversation) {
  const parsedCount = Number(
    conversation?.adminUnreadCount ?? conversation?.unreadCount ?? 0
  );

  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
}

/**
 * Extracts a safe user-facing error from support API failures.
 */
export function getSupportErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === "string" ? error.response.data : "") ||
    error?.message ||
    fallback
  );
}
