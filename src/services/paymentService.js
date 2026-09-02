import api from "./api";

export const paymentService = {
  initialize: (bookingId) =>
    api.post(`/payments/initialize/${bookingId}`),

  verify: (reference) =>
    api.get(`/payments/verify/${reference}`),

  getByBooking: (bookingId) =>
    api.get(`/payments/booking/${bookingId}`),
};