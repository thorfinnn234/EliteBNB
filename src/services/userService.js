import api from "./api";

export const userService = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (payload) => api.put("/user/profile", payload),
};
