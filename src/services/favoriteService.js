import api from "./api";

export const favoriteService = {
  getMine: () => api.get("/favorites"),

  add: (propertyId) =>
    api.post(`/favorites/${propertyId}`),

  remove: (propertyId) =>
    api.delete(`/favorites/${propertyId}`),

  getStatus: (propertyId) =>
    api.get(`/favorites/${propertyId}/status`),
};