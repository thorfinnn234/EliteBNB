import { ArrowLeft, CheckCheck, Clock3, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { conversationService } from "../../services/conversationService";
import { normalizeApiList } from "../../utils/userBackendMappers";

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

function Identity({ imageUrl, name }) {
  return imageUrl ? (
    <img className="h-10 w-10 shrink-0 rounded-full object-cover" src={imageUrl} alt="" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#172554] text-sm font-bold text-white">
      {getInitials(name)}
    </span>
  );
}

/**
 * Keeps the approved Host split inbox architecture while replacing all demo
 * conversations with backend summaries, participant messages, and confirmed
 * sends. Host ownership/security remains enforced by the API.
 */
export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("conversation");
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");

  const loadConversations = async () => {
    try {
      const response = await conversationService.getAll();
      setConversations(normalizeApiList(response.data));
      setError("");
    } catch (loadError) {
      setError(getErrorMessage(loadError, "We couldn't load guest conversations."));
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setThreadLoading(true);

    try {
      const response = await conversationService.getById(conversationId);
      setConversation(response.data?.conversation ?? response.data);
      setMessages(response.data?.messages ?? []);
      await conversationService.markRead(conversationId);
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
      if (!silent) setThreadLoading(false);
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
      });
      return undefined;
    }

    window.queueMicrotask(() => loadConversation(selectedId));
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") loadConversation(selectedId, true);
    }, POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [selectedId]);

  const sendMessage = async (event) => {
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
      setSendError(getErrorMessage(sendFailure, "Your reply could not be sent."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">COMMUNICATION</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">Messages</h1>
          <p className="mt-2 text-[#64748B]">Private correspondence with your guests.</p>
        </header>

        <div className="grid min-h-[42rem] gap-6 lg:grid-cols-3">
          <aside className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="border-b border-[#E5E7EB] p-4">
              <strong className="text-lg text-[#172554]">Inbox</strong>
            </div>
            {loading ? <p className="p-4 text-sm text-[#64748B]">Loading conversations...</p> : null}
            {error ? <p className="p-4 text-sm text-red-700" role="alert">{error}</p> : null}
            {!loading && !error && !conversations.length ? (
              <div className="p-6 text-sm text-[#64748B]">
                <MessageSquare className="mb-3 text-[#D4A72C]" size={24} />
                <strong className="block text-lg text-[#172554]">No conversations yet</strong>
                <p className="mt-2">Guest correspondence will appear here when a guest opens a conversation about your property.</p>
              </div>
            ) : null}
            {conversations.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSearchParams({ conversation: String(item.id) })}
                className={`flex w-full gap-3 border-t border-[#F1F5F9] p-4 text-left transition ${String(item.id) === String(selectedId) ? "bg-[#D4A72C]/10" : "hover:bg-[#FAF9F6]"}`}
              >
                <Identity imageUrl={item.otherParticipantProfileImageUrl || item.guestProfileImageUrl} name={item.otherParticipantName || item.guestName} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <strong className="truncate text-[#172554]">{item.otherParticipantName || item.guestName || "Guest"}</strong>
                    {item.unreadCount > 0 ? <em className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold not-italic text-white">{item.unreadCount}</em> : null}
                  </span>
                  <small className="mt-1 block truncate text-[#D4A72C]">{item.propertyTitle || "EliteBNB property"}</small>
                  <span className="mt-1 block truncate text-sm text-[#64748B]">{item.lastMessagePreview || "No messages yet"}</span>
                </span>
                <Clock3 size={13} className="mt-1 shrink-0 text-[#94A3B8]" aria-hidden="true" />
              </button>
            ))}
          </aside>

          <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm lg:col-span-2">
            {!selectedId ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[#64748B]">
                <MessageSquare className="text-[#D4A72C]" size={30} />
                <h2 className="mt-3 text-2xl font-bold text-[#172554]">Select a conversation</h2>
                <p className="mt-2">Guest correspondence will appear here.</p>
              </div>
            ) : threadLoading ? (
              <p className="p-6 text-sm text-[#64748B]">Loading correspondence...</p>
            ) : conversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-[#E5E7EB] p-5">
                  <button type="button" onClick={() => setSearchParams({})} className="mr-1 text-[#64748B] lg:hidden" aria-label="Back to messages"><ArrowLeft size={18} /></button>
                  <Identity imageUrl={conversation.otherParticipantProfileImageUrl || conversation.guestProfileImageUrl} name={conversation.otherParticipantName || conversation.guestName} />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[#172554]">{conversation.otherParticipantName || conversation.guestName || "Guest"}</strong>
                    <small className="text-[#D4A72C]">{conversation.propertyTitle || "EliteBNB property"}</small>
                  </span>
                  <span className="hidden text-right text-xs text-[#64748B] md:block">
                    {conversation.bookingId ? `Booking #${conversation.bookingId}` : "Property conversation"}
                    {conversation.propertyId ? (
                      <Link className="mt-1 block font-bold text-[#172554]" to={`/property/${conversation.propertyId}`}>
                        View property
                      </Link>
                    ) : null}
                  </span>
                </header>
                <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-[#FAF9F6] to-white p-6">
                  {messages.map((message) => {
                    const ownMessage = message.senderRole === "HOST";
                    return <article key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-3 ${ownMessage ? "rounded-br-sm bg-[#D4A72C] text-[#172554]" : "rounded-bl-sm bg-[#EEF0F4] text-[#172554]"}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><small className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">{formatMessageDate(message.createdAt)}{ownMessage && message.read ? <CheckCheck size={12} /> : null}</small></div></article>;
                  })}
                </div>
                <form onSubmit={sendMessage} className="border-t border-[#E5E7EB] p-4">
                  <div className="flex gap-3">
                    <textarea value={input} maxLength={MAX_MESSAGE_LENGTH} onChange={(event) => { setInput(event.target.value); setSendError(""); }} placeholder="Reply to your guest..." rows={2} className="min-h-12 flex-1 resize-none rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none" />
                    <button type="submit" disabled={sending || !input.trim()} className="self-end rounded-lg bg-[#D4A72C] p-3 text-[#172554] disabled:opacity-50" aria-label="Send message"><Send size={18} /></button>
                  </div>
                  {sendError ? <p className="mt-2 text-sm text-red-700" role="alert">{sendError}</p> : null}
                  <p className="mt-1 text-right text-xs text-[#94A3B8]">{input.length}/{MAX_MESSAGE_LENGTH}</p>
                </form>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
