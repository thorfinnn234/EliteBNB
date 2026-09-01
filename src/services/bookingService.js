import api from "./api";

export const bookingService = {
  create: (payload) => api.post("/bookings", payload),

  getMine: () => api.get("/bookings/my"),

  getHostReservations: () => api.get("/bookings/host"),

  updateStatus: (bookingId, status) =>
    api.patch(`/bookings/${bookingId}/status`, null, {
      params: { status },
    }),
};