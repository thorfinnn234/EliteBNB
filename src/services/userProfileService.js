import api from "./api";

export const userProfileService = {
  getProfile: () => api.get("/user/profile"),

  updateProfile: (data) =>
    api.put("/user/profile", data),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/user/profile/image", formData);
  },
};