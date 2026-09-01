import api from "./api";

export const reviewService = {
  create: (payload) => api.post("/reviews", payload),

  getMine: () => api.get("/reviews/my"),

  getPropertyReviews: (propertyId) =>
    api.get(`/properties/${propertyId}/reviews`),

  getHostReviews: () =>
    api.get("/host/reviews"),

  respond: (reviewId, response) =>
    api.put(`/reviews/${reviewId}/response`, {
      response,
    }),
};