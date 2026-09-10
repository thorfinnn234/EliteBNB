import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supportMessagingService } from "../../services/supportMessagingService";
import {
  SUPPORT_MESSAGE_MAX_LENGTH,
  formatSupportDateTime,
  formatSupportEnum,
  formatSupportMessageTime,
  getAdminSupportUnreadCount,
  getSupportConversationId,
  getSupportErrorMessage,
  getSupportHostEmail,
  getSupportHostId,
  getSupportHostName,
  getSupportLastActivityAt,
  getSupportLastMessagePreview,
  getSupportMessageBody,
  getSupportMessageSenderName,
  getSupportMessageSenderRole,
  getSupportVerificationStatus,
  normalizeSupportConversationPayload,
  normalizeSupportList,
} from "../../utils/supportMessagingMappers";
import "./HostSupport.css";

const initialInboxState = {
  conversations: [],
  error: "",
  loading: true,
};

const initialThreadState = {
  conversation: null,
  error: "",
  loading: false,
  messages: [],
};

/**
 * Shortens long support previews in the inbox while preserving complete message
 * bodies inside the selected thread.
 */
function truncatePreview(value, maxLength = 120) {
  if (!value) return "No messages yet";

  const text = String(value);

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

/**
 * Builds a tiny initials mark from real Host identity returned by the support
 * summary/detail DTO. No Host profile imagery is invented in C1.
 */
function getHostInitials(conversation) {
  const source = getSupportHostName(conversation);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

/**
 * Status chip for verification context. It is informational only; support
 * messaging remains available before, during, and after verification.
 */
function VerificationContextBadge({ status }) {
  return (
    <span className="elite-admin-host-support__verification">
      <ShieldCheck size={14} aria-hidden="true" />
      {formatSupportEnum(status, "Verification status unavailable")}
    </span>
  );
}

/**
 * One Admin inbox row backed by a support conversation summary. The unread
 * count comes from the support DTO, not the Admin notifications endpoint.
 */
function SupportInboxItem({ active, conversation, onSelect }) {
  const conversationId = getSupportConversationId(conversation);
  const unreadCount = getAdminSupportUnreadCount(conversation);
  const lastMessage = getSupportLastMessagePreview(conversation);

  return (
    <button
      className={`elite-admin-host-support__inbox-item${
        active ? " is-active" : ""
      }${unreadCount > 0 ? " is-unread" : ""}`}
      onClick={() => onSelect(conversation)}
      type="button"
    >
      <span className="elite-admin-host-support__avatar">
        {getHostInitials(conversation)}
      </span>

      <span className="elite-admin-host-support__inbox-copy">
        <strong>{getSupportHostName(conversation)}</strong>
        <small>{getSupportHostEmail(conversation) || "Host email unavailable"}</small>
        <em>{truncatePreview(lastMessage)}</em>
      </span>

      <span className="elite-admin-host-support__inbox-meta">
        {unreadCount > 0 ? (
          <mark>{unreadCount > 9 ? "9+" : unreadCount} unread</mark>
        ) : (
          <small>Read</small>
        )}
        <small>{formatSupportDateTime(getSupportLastActivityAt(conversation))}</small>
        <small>{conversationId ? `Thread #${conversationId}` : "Thread id unavailable"}</small>
      </span>
    </button>
  );
}

/**
 * Support message bubble. Admin-authored messages align right; Host-authored
 * messages align left so the distinction stays clear without depending on
 * color alone.
 */
function SupportMessage({ message }) {
  const senderRole = getSupportMessageSenderRole(message);
  const ownMessage = senderRole === "ADMIN";
  const senderName =
    getSupportMessageSenderName(message) ||
    (ownMessage ? "EliteBNB Admin" : "Host");

  return (
    <article
      className={`elite-admin-host-support__message${
        ownMessage ? " is-admin" : " is-host"
      }`}
    >
      <div>
        <span>{senderName}</span>
        <p>{getSupportMessageBody(message) || "No message body recorded."}</p>
        <small>{formatSupportMessageTime(message.createdAt || message.sentAt)}</small>
      </div>
    </article>
  );
}

/**
 * Admin support thread panel. It reads and writes through the dedicated C1
 * support endpoints and does not call normal USER↔HOST messaging services.
 */
function SupportThreadPanel({
  composerValue,
  onBack,
  onComposerChange,
  onRefresh,
  onSend,
  selectedId,
  sendError,
  sending,
  threadState,
}) {
  const messagesRef = useRef(null);
  const conversation = threadState.conversation;

  useEffect(() => {
    if (!messagesRef.current) return;

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [threadState.messages]);

  if (!selectedId) {
    return (
      <section className="elite-admin-host-support__thread is-empty">
        <MessageCircle size={30} aria-hidden="true" />
        <h3>Select a Host support thread</h3>
        <p>
          Open a conversation from the inbox to read Host/Admin support
          messages and reply through the C1 backend.
        </p>
      </section>
    );
  }

  return (
    <section className="elite-admin-host-support__thread">
      <header className="elite-admin-host-support__thread-header">
        <button
          aria-label="Back to support inbox"
          className="elite-admin-host-support__back"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <span className="elite-admin-host-support__avatar">
          {getHostInitials(conversation)}
        </span>

        <div>
          <span>Host support</span>
          <h3>{getSupportHostName(conversation)}</h3>
          <p>
            {getSupportHostEmail(conversation) || "Host email unavailable"}
            {getSupportHostId(conversation)
              ? ` · Host #${getSupportHostId(conversation)}`
              : ""}
          </p>
        </div>

        <VerificationContextBadge
          status={getSupportVerificationStatus(conversation)}
        />
      </header>

      {threadState.loading ? (
        <div className="elite-admin-host-support__thread-state" role="status">
          <Loader2 size={24} aria-hidden="true" />
          Loading support conversation...
        </div>
      ) : null}

      {!threadState.loading && threadState.error ? (
        <div className="elite-admin-host-support__thread-state is-error" role="alert">
          <AlertTriangle size={24} aria-hidden="true" />
          <p>{threadState.error}</p>
          <button onClick={onRefresh} type="button">
            <RefreshCw size={16} aria-hidden="true" />
            Retry thread
          </button>
        </div>
      ) : null}

      {!threadState.loading && !threadState.error ? (
        <div
          aria-label="Host support conversation messages"
          className="elite-admin-host-support__messages"
          ref={messagesRef}
          role="log"
        >
          {threadState.messages.length === 0 ? (
            <div className="elite-admin-host-support__thread-empty">
              <Inbox size={24} aria-hidden="true" />
              <strong>No support messages yet</strong>
              <p>
                Reply when a Host asks for help, or start the conversation from
                Host Verification using Message Host.
              </p>
            </div>
          ) : (
            threadState.messages.map((message, index) => (
              <SupportMessage
                key={message.id ?? `${getSupportMessageSenderRole(message)}-${index}`}
                message={message}
              />
            ))
          )}
        </div>
      ) : null}

      <form className="elite-admin-host-support__composer" onSubmit={onSend}>
        <label htmlFor="elite-admin-host-support-message">Reply</label>
        <div>
          <textarea
            id="elite-admin-host-support-message"
            maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
            onChange={(event) => onComposerChange(event.target.value)}
            placeholder="Reply to this Host..."
            rows={3}
            value={composerValue}
          />
          <button
            disabled={sending || !composerValue.trim() || threadState.loading}
            type="submit"
          >
            {sending ? (
              <Loader2 size={18} aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
        <footer>
          <span>{composerValue.length}/{SUPPORT_MESSAGE_MAX_LENGTH}</span>
          {sendError ? (
            <strong role="alert">
              <AlertTriangle size={15} aria-hidden="true" />
              {sendError}
            </strong>
          ) : (
            <span>
              <CheckCircle2 size={15} aria-hidden="true" />
              Replies are sent through Host/Admin support.
            </span>
          )}
        </footer>
      </form>
    </section>
  );
}

/**
 * Admin Host Support workspace. It lists real support conversation summaries
 * and opens selected threads via a query param so other Admin pages can route
 * directly to a backend-created support conversation.
 */
export default function HostSupport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("conversation");
  const [composerValue, setComposerValue] = useState("");
  const [inboxState, setInboxState] = useState(initialInboxState);
  const [reloadToken, setReloadToken] = useState(0);
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [threadState, setThreadState] = useState(initialThreadState);

  const unreadTotal = useMemo(
    () =>
      inboxState.conversations.reduce(
        (total, conversation) =>
          total + getAdminSupportUnreadCount(conversation),
        0
      ),
    [inboxState.conversations]
  );

  /**
   * Loads the Admin support inbox. C1 does not define filters/pagination for
   * this endpoint, so the page simply renders the backend-returned summaries.
   */
  const loadInbox = useCallback(async () => {
    setInboxState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));

    try {
      const response =
        await supportMessagingService.getHostSupportConversations();

      setInboxState({
        conversations: normalizeSupportList(response.data),
        error: "",
        loading: false,
      });
    } catch (error) {
      setInboxState({
        conversations: [],
        error: getSupportErrorMessage(
          error,
          "Unable to load Host support conversations."
        ),
        loading: false,
      });
    }
  }, []);

  /**
   * Loads one selected support thread, marks it read for Admin, and clears only
   * that thread's local unread count after backend confirmation.
   */
  const loadConversation = useCallback(
    async (conversationId, { silent = false } = {}) => {
      if (!conversationId) {
        setThreadState(initialThreadState);
        return;
      }

      if (!silent) {
        setThreadState({
          conversation: null,
          error: "",
          loading: true,
          messages: [],
        });
      }

      try {
        const response =
          await supportMessagingService.getHostSupportConversation(
            conversationId
          );
        const normalizedThread = normalizeSupportConversationPayload(
          response.data
        );

        setThreadState({
          conversation: normalizedThread.conversation,
          error: "",
          loading: false,
          messages: normalizedThread.messages,
        });

        try {
          await supportMessagingService.markAdminSupportConversationRead(
            conversationId
          );
          setInboxState((current) => ({
            ...current,
            conversations: current.conversations.map((conversation) =>
              String(getSupportConversationId(conversation)) ===
                String(conversationId) &&
              getAdminSupportUnreadCount(conversation) > 0
                ? {
                    ...conversation,
                    adminUnreadCount: 0,
                    unreadCount: 0,
                  }
                : conversation
            ),
          }));
        } catch (readError) {
          console.error(
            "Failed to mark Admin support conversation read:",
            readError
          );
        }
      } catch (error) {
        setThreadState({
          conversation: null,
          error: getSupportErrorMessage(
            error,
            "Unable to load this Host support conversation."
          ),
          loading: false,
          messages: [],
        });
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    window.queueMicrotask(() => {
      if (active) loadInbox();
    });

    return () => {
      active = false;
    };
  }, [loadInbox, reloadToken]);

  useEffect(() => {
    let active = true;

    window.queueMicrotask(() => {
      if (active) loadConversation(selectedId);
    });

    return () => {
      active = false;
    };
  }, [loadConversation, selectedId]);

  /**
   * Selects a real conversation id from the inbox. Summaries without ids remain
   * non-navigable because Admin cannot safely open a guessed thread.
   */
  function handleSelectConversation(conversation) {
    const conversationId = getSupportConversationId(conversation);

    if (!conversationId) return;

    setSendError("");
    setSearchParams({ conversation: String(conversationId) });
  }

  function handleRefresh() {
    setReloadToken((current) => current + 1);
  }

  function handleBackToInbox() {
    setSearchParams({});
    setSendError("");
  }

  /**
   * Sends an Admin reply and refetches both thread and inbox so timestamps,
   * unread counts, and message ids stay backend-authoritative.
   */
  async function handleSendMessage(event) {
    event.preventDefault();

    const body = composerValue.trim();

    if (!body || !selectedId || sending) return;

    try {
      setSending(true);
      setSendError("");

      await supportMessagingService.sendAdminSupportMessage(selectedId, body);
      setComposerValue("");
      await loadConversation(selectedId, { silent: true });
      await loadInbox();
    } catch (error) {
      setSendError(
        getSupportErrorMessage(error, "Unable to send this Admin reply.")
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      className="elite-admin-host-support"
      aria-labelledby="admin-host-support-title"
    >
      <header className="elite-admin-host-support__header">
        <div>
          <span>Host support</span>
          <h2 id="admin-host-support-title">Host Support</h2>
          <p>
            Review dedicated Host/Admin support conversations for verification,
            account access, and lifecycle questions without mixing them into
            normal guest messaging.
          </p>
        </div>
        <aside aria-label="Host support inbox count">
          <MessageCircle size={22} aria-hidden="true" />
          <strong>
            {inboxState.loading
              ? "Loading support"
              : `${inboxState.conversations.length} ${
                  inboxState.conversations.length === 1 ? "thread" : "threads"
                }`}
          </strong>
          <small>
            {unreadTotal > 0
              ? `${unreadTotal} unread for Admin`
              : "No unread support replies"}
          </small>
        </aside>
      </header>

      <section
        className={`elite-admin-host-support__workspace${
          selectedId ? " has-selection" : ""
        }`}
      >
        <aside
          className="elite-admin-host-support__inbox"
          aria-label="Host support inbox"
        >
          <div className="elite-admin-host-support__inbox-header">
            <div>
              <span>Support desk</span>
              <h3>Conversations</h3>
            </div>
            <button
              aria-label="Refresh Host support conversations"
              disabled={inboxState.loading}
              onClick={handleRefresh}
              type="button"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </div>

          {inboxState.loading ? (
            <div className="elite-admin-host-support__skeleton" role="status">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={`host-support-skeleton-${index}`} />
              ))}
              <em className="sr-only">Loading Host support conversations</em>
            </div>
          ) : null}

          {!inboxState.loading && inboxState.error ? (
            <div className="elite-admin-host-support__inbox-state" role="alert">
              <AlertTriangle size={24} aria-hidden="true" />
              <h3>Support inbox could not be loaded</h3>
              <p>{inboxState.error}</p>
              <button onClick={handleRefresh} type="button">
                Retry inbox
              </button>
            </div>
          ) : null}

          {!inboxState.loading &&
          !inboxState.error &&
          inboxState.conversations.length === 0 ? (
            <div className="elite-admin-host-support__inbox-state">
              <Inbox size={24} aria-hidden="true" />
              <h3>No Host support conversations</h3>
              <p>
                The backend returned no Host/Admin support threads yet. Admins
                can create one from a Host verification record.
              </p>
            </div>
          ) : null}

          {!inboxState.loading &&
          !inboxState.error &&
          inboxState.conversations.length > 0 ? (
            <div className="elite-admin-host-support__inbox-list" role="list">
              {inboxState.conversations.map((conversation, index) => {
                const conversationId = getSupportConversationId(conversation);

                return (
                  <SupportInboxItem
                    active={String(conversationId) === String(selectedId)}
                    conversation={conversation}
                    key={conversationId ?? `host-support-${index}`}
                    onSelect={handleSelectConversation}
                  />
                );
              })}
            </div>
          ) : null}
        </aside>

        <SupportThreadPanel
          composerValue={composerValue}
          onBack={handleBackToInbox}
          onComposerChange={(value) => {
            setComposerValue(value);
            setSendError("");
          }}
          onRefresh={() => loadConversation(selectedId)}
          onSend={handleSendMessage}
          selectedId={selectedId}
          sendError={sendError}
          sending={sending}
          threadState={threadState}
        />
      </section>
    </section>
  );
}
