import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Clock3,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { requestNotificationUnreadCountRefresh } from "../../hooks/useNotificationUnreadCount";
import { conversationService } from "../../services/conversationService";
import { normalizeApiList } from "../../utils/userBackendMappers";
import "./UserMessages.css";

const POLL_INTERVAL = 10000;
const MAX_MESSAGE_LENGTH = 2000;

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getInitials(name, fallback = "EB") {
  const initials = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || fallback;
}

function formatMessageDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getConversationResponse(response) {
  return response.data?.conversation ?? response.data;
}

function ConversationIdentity({ imageUrl, name }) {
  return imageUrl ? (
    <img className="elite-messages-avatar" src={imageUrl} alt="" />
  ) : (
    <span className="elite-messages-avatar elite-messages-avatar--initials">
      {getInitials(name)}
    </span>
  );
}

function EmptyMessages({ onExplore }) {
  return (
    <div className="elite-messages-empty">
      <span className="elite-messages-empty__mark">
        <MessageSquare size={25} aria-hidden="true" />
      </span>
      <p className="elite-messages-kicker">Private correspondence</p>
      <h2>No conversations yet</h2>
      <p>Questions about a stay? Open a property or reservation and message the host directly.</p>
      <button type="button" onClick={onExplore}>
        Explore stays
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function Composer({ error, input, isSending, onChange, onSubmit }) {
  return (
    <form className="elite-messages-composer" onSubmit={onSubmit}>
      <div>
        <textarea
          value={input}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write to your host..."
          aria-label="Message body"
          rows={2}
        />
        <span>{input.length}/{MAX_MESSAGE_LENGTH}</span>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" disabled={isSending || !input.trim()}>
        {isSending ? "Sending..." : "Send"}
        <Send size={16} aria-hidden="true" />
      </button>
    </form>
  );
}

/**
 * Provides the authenticated USER correspondence workspace. URL-selected
 * conversation IDs make Property/Reservation Message Host actions deep-link
 * into the same inbox without duplicating a conversation UI.
 */
export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("conversation");
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [mobileDetail, setMobileDetail] = useState(Boolean(selectedId));

  const loadConversations = async () => {
    try {
      const response = await conversationService.getAll();
      setConversations(normalizeApiList(response.data));
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError, "We couldn't load your conversations."));
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setConversationLoading(true);

    try {
      const response = await conversationService.getById(conversationId);
      const nextConversation = getConversationResponse(response);
      setConversation(nextConversation);
      setMessages(response.data?.messages ?? []);
      await conversationService.markRead(conversationId);
      /*
       * NotificationResponse currently does not expose conversation/message IDs.
       * After the real conversation read endpoint succeeds, ask shells to refetch
       * unread notification counts instead of guessing which notification maps
       * to this thread from display text.
       */
      requestNotificationUnreadCountRefresh();
      setConversations((current) =>
        current.map((item) =>
          String(item.id) === String(conversationId)
            ? { ...item, unreadCount: 0 }
            : item
        )
      );
    } catch (loadError) {
      if (!silent) setError(getErrorMessage(loadError, "We couldn't load this conversation."));
    } finally {
      if (!silent) setConversationLoading(false);
    }
  };

  useEffect(() => {
    window.queueMicrotask(loadConversations);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      window.queueMicrotask(() => {
        setConversation(null);
        setMessages([]);
        setMobileDetail(false);
      });
      return undefined;
    }

    window.queueMicrotask(() => setMobileDetail(true));
    window.queueMicrotask(() => loadConversation(selectedId));
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") loadConversation(selectedId, true);
    }, POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [selectedId]);

  const selectConversation = (conversationId) => {
    setSearchParams({ conversation: String(conversationId) });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const body = input.trim();
    if (!body || !selectedId || sending) return;

    try {
      setSending(true);
      setSendError("");
      await conversationService.sendMessage(selectedId, body);
      setInput("");
      await loadConversation(selectedId, true);
      await loadConversations();
    } catch (sendFailure) {
      setSendError(getErrorMessage(sendFailure, "Your message could not be sent."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className={`elite-user-page elite-messages-page${mobileDetail ? " is-detail-open" : ""}`} data-user-page>
      <header className="elite-messages-page__header">
        <div>
          <p className="elite-messages-kicker">Private correspondence</p>
          <h2>Messages</h2>
          <p>Thoughtful conversations around the stays you have chosen.</p>
        </div>
        <MessageSquare size={30} aria-hidden="true" />
      </header>

      <div className="elite-messages-workspace">
        <aside className="elite-messages-inbox" aria-label="Conversations">
          <div className="elite-messages-inbox__header">
            <strong>Inbox</strong>
            <label>
              <Search size={16} aria-hidden="true" />
              <input placeholder="Find a conversation" aria-label="Find a conversation" />
            </label>
          </div>
          {loading ? <p className="elite-messages-state">Loading conversations...</p> : null}
          {!loading && error ? <p className="elite-messages-state" role="alert">{error}</p> : null}
          {!loading && !error && !conversations.length ? <EmptyMessages onExplore={() => window.location.assign("/user/explore")} /> : null}
          <div className="elite-messages-list">
            {conversations.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`elite-message-thread${String(item.id) === String(selectedId) ? " is-selected" : ""}`}
                onClick={() => selectConversation(item.id)}
              >
                <ConversationIdentity imageUrl={item.otherParticipantProfileImageUrl} name={item.otherParticipantName} />
                <span className="elite-message-thread__body">
                  <span className="elite-message-thread__topline">
                    <strong>{item.otherParticipantName || "Guest"}</strong>
                    {item.unreadCount > 0 ? <em>{item.unreadCount}</em> : null}
                  </span>
                  <small>{item.propertyTitle || "EliteBNB stay"}</small>
                  <span>{item.lastMessagePreview || "No messages yet"}</span>
                </span>
                <Clock3 size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </aside>

        <section className="elite-messages-thread" aria-label="Conversation">
          {!selectedId ? (
            <div className="elite-messages-thread__welcome">
              <MessageSquare size={30} aria-hidden="true" />
              <h2>Select a conversation</h2>
              <p>Your private stay correspondence will appear here.</p>
            </div>
          ) : conversationLoading ? (
            <p className="elite-messages-state">Loading correspondence...</p>
          ) : conversation ? (
            <>
              <header className="elite-messages-thread__header">
                <button type="button" onClick={() => setSearchParams({})} className="elite-messages-back">
                  <ArrowLeft size={16} aria-hidden="true" /> Back to Messages
                </button>
                <div>
                  <ConversationIdentity imageUrl={conversation.otherParticipantProfileImageUrl} name={conversation.otherParticipantName} />
                  <span>
                    <strong>{conversation.otherParticipantName || "Guest"}</strong>
                    <small>
                      {conversation.propertyTitle || "EliteBNB stay"}
                      {conversation.bookingId ? ` · Booking #${conversation.bookingId}` : ""}
                    </small>
                  </span>
                </div>
                {conversation.propertyId ? (
                  <Link to={`/user/property/${conversation.propertyId}`} className="elite-messages-view-property">
                    View property <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ) : null}
              </header>
              <div className="elite-messages-thread__body-scroll">
                {messages.map((message) => {
                  const ownMessage = message.senderRole === "USER";
                  return (
                    <article key={message.id} className={`elite-message-bubble${ownMessage ? " is-own" : ""}`}>
                      <p>{message.body}</p>
                      <small>
                        {formatMessageDate(message.createdAt)}
                        {ownMessage && message.read ? <CheckCheck size={13} aria-label="Read" /> : null}
                      </small>
                    </article>
                  );
                })}
              </div>
              <Composer error={sendError} input={input} isSending={sending} onChange={(value) => { setInput(value); setSendError(""); }} onSubmit={handleSend} />
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}
