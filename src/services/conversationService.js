import api from "./api";

/**
 * Uses the authenticated conversation API. The backend derives guest/host and
 * sender ownership from the JWT; callers must send only property/booking IDs
 * when creating a thread and only a body when sending a message.
 */
export const conversationService = {
  create: (payload) => api.post("/conversations", payload),
  getAll: () => api.get("/conversations"),
  getById: (conversationId) => api.get(`/conversations/${conversationId}`),
  sendMessage: (conversationId, body) =>
    api.post(`/conversations/${conversationId}/messages`, { body }),
  markRead: (conversationId) =>
    api.patch(`/conversations/${conversationId}/read`),
};
