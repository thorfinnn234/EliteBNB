import api from "./api";

export const notificationService = {
  getAll: () => api.get("/notifications"),

  getUnreadCount: () =>
    api.get("/notifications/unread-count"),

  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch("/notifications/read-all"),

  delete: (id) =>
    api.delete(`/notifications/${id}`),
};