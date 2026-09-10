import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { supportMessagingService } from "../../services/supportMessagingService";
import {
  SUPPORT_MESSAGE_MAX_LENGTH,
  formatSupportMessageTime,
  getSupportErrorMessage,
  getSupportMessageBody,
  getSupportMessageSenderName,
  getSupportMessageSenderRole,
  normalizeSupportConversationPayload,
} from "../../utils/supportMessagingMappers";
import "./HostSupportDrawer.css";

const initialThreadState = {
  conversation: null,
  error: "",
  loading: false,
  messages: [],
};

/**
 * Host-facing support drawer for the verification lifecycle route.
 * It deliberately talks to the dedicated Host/Admin support endpoints rather
 * than the normal guest messaging API, keeping both conversation systems
 * semantically and contractually separate.
 */
export default function HostSupportDrawer({
  hostName,
  onClose,
  open,
  variant = "drawer",
}) {
  const [composerValue, setComposerValue] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [threadState, setThreadState] = useState(initialThreadState);
  const messageListRef = useRef(null);
  const embedded = variant === "page";
  const active = embedded || open;

  useBodyScrollLock(!embedded && open);

  /**
   * Loads the Host's single support thread and then marks it read. The read call
   * is intentionally non-blocking for display; a failure should not hide the
   * conversation that the Host opened for help.
   */
  const loadThread = useCallback(
    async ({ silent = false } = {}) => {
      if (!active) return;

      if (!silent) {
        setThreadState((current) => ({
          ...current,
          error: "",
          loading: true,
        }));
      }

      try {
        const response =
          await supportMessagingService.getSupportConversation();
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
          await supportMessagingService.markSupportConversationRead();
          setThreadState((current) => ({
            ...current,
            conversation: current.conversation
              ? {
                  ...current.conversation,
                  hostUnreadCount: 0,
                  unreadCount: 0,
                }
              : current.conversation,
          }));
        } catch (readError) {
          console.error(
            "Failed to mark Host support conversation read:",
            readError
          );
        }
      } catch (error) {
        setThreadState((current) => ({
          ...current,
          error: getSupportErrorMessage(
            error,
            "We could not load your EliteBNB support conversation."
          ),
          loading: false,
        }));
      }
    },
    [active]
  );

  useEffect(() => {
    if (!active) return undefined;

    let mounted = true;

    window.queueMicrotask(() => {
      if (mounted) loadThread();
    });

    function handleKeyDown(event) {
      if (!embedded && event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      mounted = false;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, embedded, loadThread, onClose]);

  useEffect(() => {
    if (!active || !messageListRef.current) return;

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [active, threadState.messages]);

  /**
   * Sends a trimmed support message through the Host C1 endpoint, then refreshes
   * the thread from the backend so message ids/timestamps remain authoritative.
   */
  async function handleSendMessage(event) {
    event.preventDefault();

    const body = composerValue.trim();

    if (!body || sending) return;

    try {
      setSending(true);
      setSendError("");

      await supportMessagingService.sendSupportMessage(body);
      setComposerValue("");
      await loadThread({ silent: true });
    } catch (error) {
      setSendError(
        getSupportErrorMessage(
          error,
          "Your support message could not be sent."
        )
      );
    } finally {
      setSending(false);
    }
  }

  if (!active) return null;

  const threadMarkup = (
    <aside
      aria-labelledby="elite-host-support-title"
      aria-modal={embedded ? undefined : "true"}
      className="elite-host-support__drawer"
      role={embedded ? "region" : "dialog"}
    >
      <header className="elite-host-support__header">
        <div>
          <span>EliteBNB support</span>
          <h2 id="elite-host-support-title">Contact EliteBNB Support</h2>
          <p>
            This is your dedicated Host/Admin support thread. Verification
            notes and support messages stay separate.
          </p>
        </div>
        {!embedded ? (
          <button
            aria-label="Close EliteBNB support"
            onClick={onClose}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <section className="elite-host-support__identity" aria-label="Support context">
        <span>{(hostName || "Host").charAt(0).toUpperCase()}</span>
        <div>
          <strong>{hostName || "EliteBNB Host"}</strong>
          <small>Host support conversation</small>
        </div>
      </section>

      {threadState.loading ? (
        <div className="elite-host-support__state" role="status">
          <Loader2 size={24} aria-hidden="true" />
          Loading your support thread...
        </div>
      ) : null}

      {!threadState.loading && threadState.error ? (
        <div className="elite-host-support__state is-error" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <p>{threadState.error}</p>
          <button onClick={() => loadThread()} type="button">
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : null}

      {!threadState.loading && !threadState.error ? (
        <div
          className="elite-host-support__messages"
          ref={messageListRef}
          role="log"
          aria-label="Host support messages"
        >
          {threadState.messages.length === 0 ? (
            <div className="elite-host-support__empty">
              <MessageSquare size={24} aria-hidden="true" />
              <strong>No support messages yet</strong>
              <p>
                Send a note to EliteBNB Support if you need help with your
                Host verification or account access.
              </p>
            </div>
          ) : (
            threadState.messages.map((message, index) => {
              const senderRole = getSupportMessageSenderRole(message);
              const ownMessage = senderRole === "HOST";
              const senderName =
                getSupportMessageSenderName(message) ||
                (ownMessage ? "You" : "EliteBNB Support");

              return (
                <article
                  className={`elite-host-support__message${
                    ownMessage ? " is-host" : " is-admin"
                  }`}
                  key={message.id ?? `${senderRole}-${index}`}
                >
                  <div>
                    <span>{senderName}</span>
                    <p>{getSupportMessageBody(message) || "No message body recorded."}</p>
                    <small>{formatSupportMessageTime(message.createdAt || message.sentAt)}</small>
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : null}

      <form className="elite-host-support__composer" onSubmit={handleSendMessage}>
        <label htmlFor="elite-host-support-message">Message</label>
        <div>
          <textarea
            id="elite-host-support-message"
            maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
            onChange={(event) => {
              setComposerValue(event.target.value);
              setSendError("");
            }}
            placeholder="Write to EliteBNB Support..."
            rows={3}
            value={composerValue}
          />
          <button
            aria-label="Send support message"
            disabled={sending || !composerValue.trim()}
            type="submit"
          >
            {sending ? (
              <Loader2 size={18} aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            <span>{sending ? "Sending..." : "Send"}</span>
          </button>
        </div>
        <footer>
          <span>{composerValue.length}/{SUPPORT_MESSAGE_MAX_LENGTH}</span>
          {sendError ? (
            <strong role="alert">
              <AlertCircle size={15} aria-hidden="true" />
              {sendError}
            </strong>
          ) : (
            <span>
              <CheckCircle2 size={15} aria-hidden="true" />
              Support messages are sent to EliteBNB Admin.
            </span>
          )}
        </footer>
      </form>
    </aside>
  );

  if (embedded) {
    return (
      <section className="elite-host-support elite-host-support--page">
        {threadMarkup}
      </section>
    );
  }

  return (
    <div className="elite-host-support" role="presentation">
      {threadMarkup}
    </div>
  );
}
