import api from "./api";

export const userService = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (payload) => api.put("/users/me", payload),
};
