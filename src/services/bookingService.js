import api from "./api";

export const bookingService = {
  create: (payload) => api.post("/bookings", payload),
  getMine: () => api.get("/bookings/me"),
  getById: (id) => api.get(`/bookings/${id}`),
};
