import api from "./api";

export const hostProfileService = {
  getProfile: () => api.get("/host/profile"),

  updateProfile: (payload) =>
    api.put("/host/profile", payload),

  uploadProfileImage: (file) => {
    const formData = new FormData();

    formData.append("file", file);

    return api.post(
      "/host/profile/image",
      formData
    );
  },
};