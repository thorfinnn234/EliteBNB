import api from "./api";

/**
 * Dedicated Host/Admin support messaging API boundary.
 * These endpoints are intentionally separate from the existing guest/Host
 * conversationService so support threads do not inherit normal booking-message
 * assumptions or mutate USER↔HOST messaging contracts.
 */
export const supportMessagingService = {
  /**
   * Reads the authenticated Host's single support conversation. The backend
   * owns conversation creation/lookup and allows ACTIVE Hosts before, during,
   * and after verification.
   */
  getSupportConversation: () => api.get("/host/support-conversation"),

  /**
   * Sends a Host-authored support message. The payload mirrors the finalized C1
   * contract and rejects blank bodies at the UI layer before reaching here.
   */
  sendSupportMessage: (body) =>
    api.post("/host/support-conversation/messages", { body }),

  /**
   * Marks the Host side of the support conversation read. This does not attempt
   * to synchronize Admin/User notification badges; C1 notification sync is a
   * later phase.
   */
  markSupportConversationRead: () =>
    api.patch("/host/support-conversation/read"),

  /**
   * Lists Admin support inbox summaries for Host support conversations.
   */
  getHostSupportConversations: () =>
    api.get("/admin/host-support-conversations"),

  /**
   * Loads one Admin support conversation and its messages by real conversation
   * id. The page normalizes wrapper shapes but does not invent message fields.
   */
  getHostSupportConversation: (conversationId) =>
    api.get(`/admin/host-support-conversations/${conversationId}`),

  /**
   * Creates or returns the one support conversation for a real Host id. Admin
   * Host Verification uses this to open support even when the Host has not
   * initiated the thread yet.
   */
  createOrGetHostSupportConversation: (hostId) =>
    api.post(`/admin/host-support-conversations/host/${hostId}`),

  /**
   * Sends an Admin-authored response in a selected Host support thread.
   */
  sendAdminSupportMessage: (conversationId, body) =>
    api.post(`/admin/host-support-conversations/${conversationId}/messages`, {
      body,
    }),

  /**
   * Marks the Admin side of a selected Host support conversation read.
   */
  markAdminSupportConversationRead: (conversationId) =>
    api.patch(`/admin/host-support-conversations/${conversationId}/read`),
};
