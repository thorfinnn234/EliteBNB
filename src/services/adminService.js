import api from "./api";

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: () => api.get("/admin/users"),
  getListings: () => api.get("/admin/listings"),
};
