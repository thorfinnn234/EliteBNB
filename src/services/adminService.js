import api from "./api";

/**
 * Sends GET requests with optional backend-supported query parameters.
 * Admin pages can pass filters later without this service inventing pagination,
 * sorting, or default query behavior the backend did not define.
 */
function getWithParams(path, params) {
  return api.get(path, { params });
}

/**
 * Central Admin API contract.
 * These methods intentionally mirror the finalized backend routes and let
 * feature pages handle loading, empty, success, and error states themselves.
 */
export const adminService = {
  getMe: () => api.get("/admin/me"),
  getProfile: () => api.get("/admin/me"),

  getDashboard: (params) => getWithParams("/admin/dashboard", params),

  getAnalyticsOverview: (params) =>
    getWithParams("/admin/analytics/overview", params),
  getUsersGrowthAnalytics: (params) =>
    getWithParams("/admin/analytics/users/growth", params),
  getHostsGrowthAnalytics: (params) =>
    getWithParams("/admin/analytics/hosts/growth", params),
  getMonthlyBookingsAnalytics: (params) =>
    getWithParams("/admin/analytics/bookings/monthly", params),
  getMonthlyRevenueAnalytics: (params) =>
    getWithParams("/admin/analytics/revenue/monthly", params),
  getBookingStatusAnalytics: (params) =>
    getWithParams("/admin/analytics/bookings/statuses", params),
  getPaymentStatusAnalytics: (params) =>
    getWithParams("/admin/analytics/payments/statuses", params),
  getPropertyStatusAnalytics: (params) =>
    getWithParams("/admin/analytics/properties/statuses", params),
  getPropertyApprovalAnalytics: (params) =>
    getWithParams("/admin/analytics/properties/approvals", params),

  getUsers: (params) => getWithParams("/admin/users", params),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, payload, config) =>
    api.patch(`/admin/users/${id}/status`, payload, config),

  getHostVerifications: (params) =>
    getWithParams("/admin/host-verifications", params),
  getPendingHostVerifications: (params) =>
    getWithParams("/admin/host-verifications/pending", params),
  getHostVerificationById: (id) =>
    api.get(`/admin/host-verifications/${id}`),
  updateHostVerificationStatus: (id, payload, config) =>
    api.patch(`/admin/host-verifications/${id}/status`, payload, config),

  getProperties: (params) => getWithParams("/admin/properties", params),
  getPropertyApprovals: (params) =>
    getWithParams("/admin/properties/approvals", params),
  getPropertyById: (id) => api.get(`/admin/properties/${id}`),
  updatePropertyStatus: (id, payload, config) =>
    api.patch(`/admin/properties/${id}/status`, payload, config),
  updatePropertyApproval: (id, payload, config) =>
    api.patch(`/admin/properties/${id}/approval`, payload, config),

  getBookings: (params) => getWithParams("/admin/bookings", params),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, payload, config) =>
    api.patch(`/admin/bookings/${id}/status`, payload, config),

  getPayments: (params) => getWithParams("/admin/payments", params),
  getPaymentById: (id) => api.get(`/admin/payments/${id}`),
  updatePaymentStatus: (id, payload, config) =>
    api.patch(`/admin/payments/${id}/status`, payload, config),

  getRefunds: (params) => getWithParams("/admin/refunds", params),
  getRefundById: (id) => api.get(`/admin/refunds/${id}`),
  updateRefundStatus: (id, payload, config) =>
    api.patch(`/admin/refunds/${id}/status`, payload, config),

  getReports: (params) => getWithParams("/admin/reports", params),
  getReportById: (id) => api.get(`/admin/reports/${id}`),
  updateReportStatus: (id, payload, config) =>
    api.patch(`/admin/reports/${id}/status`, payload, config),
  moderateReport: (id, payload, config) =>
    api.post(`/admin/reports/${id}/moderate`, payload, config),

  getAuditLogs: (params) => getWithParams("/admin/audit-logs", params),
  getAuditLogById: (id) => api.get(`/admin/audit-logs/${id}`),

  getNotifications: (params) =>
    getWithParams("/admin/notifications", params),
  getNotificationUnreadCount: () =>
    api.get("/admin/notifications/unread-count"),
  markNotificationRead: (id) =>
    api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    api.patch("/admin/notifications/read-all"),

  getSettings: (params) => getWithParams("/admin/settings", params),
  getSettingByKey: (key) => api.get(`/admin/settings/${key}`),
  updateSetting: (key, payload, config) =>
    api.patch(`/admin/settings/${key}`, payload, config),
};
