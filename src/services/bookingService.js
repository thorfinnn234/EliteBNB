import api from "./api";

export const bookingService = {
  create: (payload) => api.post("/bookings", payload),

  getMine: () => api.get("/bookings/my"),
  getById: (id) => api.get(`/bookings/${id}`),

  getHostReservations: () => api.get("/bookings/host"),

  // USER cancellation is a status transition; the backend enforces ownership
  // and allows it only while the reservation is still PENDING.
  cancel: (bookingId) => api.patch(`/bookings/${bookingId}/cancel`),

  updateStatus: (bookingId, status) =>
    api.patch(`/bookings/${bookingId}/status`, null, {
      params: { status },
    }),
};
