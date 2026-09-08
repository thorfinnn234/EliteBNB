/**
 * Defines the local-only illustrated avatar options used by the frontend
 * preview identity system. These are presentation assets, not account records,
 * so no selection here implies backend persistence.
 */
export const guestAvatarOptions = [
  {
    id: "coastal-arch",
    label: "Coastal arch",
    ground: "#F1EADF",
    skin: "#A9704E",
    hair: "#172554",
    accent: "#D4A72C",
    robe: "#3A5B78",
  },
  {
    id: "ivory-frame",
    label: "Ivory frame",
    ground: "#FAF9F6",
    skin: "#6F432E",
    hair: "#111827",
    accent: "#C98B56",
    robe: "#64748B",
  },
  {
    id: "lagoon-slate",
    label: "Lagoon slate",
    ground: "#E8EEF2",
    skin: "#C48563",
    hair: "#263C69",
    accent: "#D4A72C",
    robe: "#172554",
  },
  {
    id: "golden-window",
    label: "Golden window",
    ground: "#E9DFC8",
    skin: "#8D563B",
    hair: "#4A2E2A",
    accent: "#D4A72C",
    robe: "#F8F4EC",
  },
  {
    id: "night-residence",
    label: "Night residence",
    ground: "#172554",
    skin: "#B77A57",
    hair: "#0F172A",
    accent: "#D4A72C",
    robe: "#FAF9F6",
  },
  {
    id: "stone-courtyard",
    label: "Stone courtyard",
    ground: "#DDE4E8",
    skin: "#7A4D3A",
    hair: "#2C2532",
    accent: "#A7B3C4",
    robe: "#172554",
  },
  {
    id: "terrace-light",
    label: "Terrace light",
    ground: "#F4E8D8",
    skin: "#D09A77",
    hair: "#5A3427",
    accent: "#D4A72C",
    robe: "#64748B",
  },
  {
    id: "gallery-blue",
    label: "Gallery blue",
    ground: "#DCE8F0",
    skin: "#9B6246",
    hair: "#16213E",
    accent: "#D4A72C",
    robe: "#FFFFFF",
  },
];

export const defaultGuestAvatarId = "coastal-arch";

/**
 * Looks up an avatar by id and safely falls back to the default option.
 * Components use this guard so stale sessionStorage values cannot break the UI.
 */
export function getGuestAvatarOption(avatarId) {
  return (
    guestAvatarOptions.find((avatar) => avatar.id === avatarId) ??
    guestAvatarOptions.find((avatar) => avatar.id === defaultGuestAvatarId) ??
    guestAvatarOptions[0]
  );
}
