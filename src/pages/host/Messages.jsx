import { useState } from "react";
import { Search, Send, Clock, CheckCheck } from "lucide-react";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [messageInput, setMessageInput] = useState("");

  const conversations = [
    {
      id: 1,
      guestName: "Sarah Johnson",
      lastMessage: "Thanks for the quick response!",
      timestamp: "2 hours ago",
      unread: 2,
      avatar: "SJ",
    },
    {
      id: 2,
      guestName: "Michael Chen",
      lastMessage: "When is check-in available?",
      timestamp: "5 hours ago",
      unread: 0,
      avatar: "MC",
    },
    {
      id: 3,
      guestName: "Emma Wilson",
      lastMessage: "The property looks amazing!",
      timestamp: "1 day ago",
      unread: 0,
      avatar: "EW",
    },
    {
      id: 4,
      guestName: "David Brown",
      lastMessage: "Can we discuss the amenities?",
      timestamp: "2 days ago",
      unread: 0,
      avatar: "DB",
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "guest",
      text: "Hi! I'm interested in booking your oceanview villa.",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      sender: "host",
      text: "Hello! Thank you for your interest. The villa is available year-round. Would you like more information?",
      timestamp: "10:35 AM",
    },
    {
      id: 3,
      sender: "guest",
      text: "Yes, please! What's the minimum stay duration?",
      timestamp: "10:40 AM",
    },
    {
      id: 4,
      sender: "host",
      text: "The minimum stay is 3 nights. We offer flexible booking for longer stays.",
      timestamp: "10:45 AM",
    },
    {
      id: 5,
      sender: "guest",
      text: "Thanks for the quick response!",
      timestamp: "10:50 AM",
    },
  ];

  const currentConversation = conversations[selectedConversation];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            COMMUNICATION
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Messages
          </h1>
          <p className="mt-2 text-[#64748B]">
            Chat with your guests and manage inquiries.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm lg:col-span-1">
            <div className="border-b border-[#E5E7EB] p-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] py-2 pl-10 pr-3 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {conversations.map((conv, index) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(index)}
                  className={`w-full border-b border-[#F1F5F9] px-4 py-4 text-left transition ${
                    selectedConversation === index
                      ? "bg-[#D4A72C]/10"
                      : "hover:bg-[#FAF9F6]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4A72C] to-[#b88d1d] flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {conv.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-[#172554] truncate">
                          {conv.guestName}
                        </h3>
                        {conv.unread > 0 && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#64748B] truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Clock size={12} />
                        {conv.timestamp}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm lg:col-span-2">
            <div className="flex h-[600px] flex-col">
              {/* Chat Header */}
              <div className="border-b border-[#E5E7EB] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4A72C] to-[#b88d1d] flex items-center justify-center text-sm font-bold text-white">
                    {currentConversation.avatar}
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#172554]">
                      {currentConversation.guestName}
                    </h2>
                    <p className="text-xs text-[#64748B]">Active 30 minutes ago</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 p-6 bg-gradient-to-b from-[#FAF9F6] to-white">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "host"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-4 py-2 ${
                        msg.sender === "host"
                          ? "bg-[#D4A72C] text-white"
                          : "bg-[#E5E7EB] text-[#172554]"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`mt-1 text-xs ${
                          msg.sender === "host"
                            ? "text-white/70 flex items-center gap-1"
                            : "text-[#64748B]"
                        }`}
                      >
                        {msg.timestamp}
                        {msg.sender === "host" && <CheckCheck size={12} />}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#E5E7EB] p-4"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-4 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#D4A72C] p-2 text-white hover:bg-[#b88d1d]"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
