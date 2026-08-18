import api from "./api";

export const hostService = {
  getDashboard: () => api.get("/host/dashboard"),
  getListings: () => api.get("/host/listings"),
  getReservations: () => api.get("/host/reservations"),
};
