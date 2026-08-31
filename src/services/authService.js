import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),

  login: (data) => api.post("/auth/login", data),

  verifyEmail: (data) => api.post("/auth/verify-email", data),

  forgotPassword: (data) => api.post("/auth/forgot-password", data),

  verifyResetCode: (data) => api.post("/auth/verify-reset-code", data),

  resetPassword: (data) => api.post("/auth/reset-password", data),
};