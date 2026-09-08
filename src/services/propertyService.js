import api from "./api";

export const propertyService = {
  getAll: (params) => {
    return api.get("/properties", { params });
  },

  getById: (id) => {
    return api.get(`/properties/${id}`);
  },

  search: (filters = {}) => {
    return api.get("/properties/search", {
      params: filters,
    });
  },

  getMyProperties: () => {
    return api.get("/properties/my");
  },

  create: (data) => {
    return api.post("/properties", data);
  },

  update: (id, data) => {
    return api.put(`/properties/${id}`, data);
  },

  remove: (id) => {
    return api.delete(`/properties/${id}`);
  },

  delete: (id) => {
    return api.delete(`/properties/${id}`);
  },

  // OLD URL-BASED IMAGE METHOD
  addImage: (id, data) => {
    return api.post(`/properties/${id}/images`, data);
  },

  // REAL FILE UPLOAD
  uploadImage: (propertyId, file, imageType, coverImage = false) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("imageType", imageType);
    formData.append("coverImage", coverImage);

    return api.post(`/properties/${propertyId}/images/upload`, formData);
  },

  getImages: (propertyId) => {
    return api.get(`/properties/${propertyId}/images`);
  },

  deleteImage: (propertyId, imageId) => {
    return api.delete(
      `/properties/${propertyId}/images/${imageId}`
    );
  },

  setCoverImage: (propertyId, imageId) => {
    return api.patch(
      `/properties/${propertyId}/images/${imageId}/cover`
    );
  },
};
