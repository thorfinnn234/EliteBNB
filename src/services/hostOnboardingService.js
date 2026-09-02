import api from "./api";

export const hostOnboardingService = {
  get: () => api.get("/host/onboarding"),

  save: (data) =>
    api.put("/host/onboarding", data),

  complete: () =>
    api.post("/host/onboarding/complete"),
};