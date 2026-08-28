import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),

  login: (data) => api.post("/auth/login", data),

  verifyEmail: (data) => api.post("/auth/verify-email", data),
};