import api from "./api";

export const bookingService = {
  // USER
  create: (payload) => api.post("/bookings", payload),
  getMine: () => api.get("/bookings/my"),
  getById: (id) => api.get(`/bookings/${id}`),

  // HOST
  getHostReservations: () => api.get("/bookings/host"),

  updateStatus: (bookingId, status) =>
    api.patch(`/bookings/${bookingId}/status`, null, {
      params: { status },
    }),
};
