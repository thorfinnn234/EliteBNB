import api from "./api";

export const hostDashboardService = {
  getDashboard: () => api.get("/host/dashboard"),
  getEarnings: () => api.get("/host/earnings"),
};
