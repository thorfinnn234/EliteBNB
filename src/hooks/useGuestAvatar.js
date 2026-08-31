import { useEffect, useState } from "react";
import {
  defaultGuestAvatarId,
  getGuestAvatarOption,
  guestAvatarOptions,
} from "../data/guestAvatarData";

const guestAvatarStorageKey = "elitebnb-guest-avatar-id";
const guestAvatarChangeEvent = "elitebnb:guest-avatar-change";

/**
 * Reads the session-scoped preview avatar id without touching auth state.
 * Session storage keeps the visual choice available during review while making
 * it clear that the backend account has not been updated.
 */
function readStoredAvatarId() {
  try {
    const storedAvatarId = window.sessionStorage.getItem(guestAvatarStorageKey);
    const hasStoredAvatar = guestAvatarOptions.some(
      (avatar) => avatar.id === storedAvatarId
    );

    return hasStoredAvatar ? storedAvatarId : defaultGuestAvatarId;
  } catch {
    return defaultGuestAvatarId;
  }
}

/**
 * Writes the selected preview avatar and notifies other mounted shell/profile
 * components. The custom event avoids introducing global app state for a small
 * frontend-only presentation preference.
 */
function storeAvatarId(avatarId) {
  try {
    window.sessionStorage.setItem(guestAvatarStorageKey, avatarId);
  } catch {
    // The visual selection can still update in memory when storage is blocked.
  }

  window.dispatchEvent(
    new CustomEvent(guestAvatarChangeEvent, { detail: { avatarId } })
  );
}

/**
 * Provides the current frontend-only Guest avatar selection.
 * It never writes tokens, fake users, or backend data; consumers receive the
 * option list, selected option, and a setter for the local presentation choice.
 */
export function useGuestAvatar() {
  const [selectedAvatarId, setSelectedAvatarIdState] =
    useState(readStoredAvatarId);

  useEffect(() => {
    const handleAvatarChange = (event) => {
      if (event.detail?.avatarId) {
        setSelectedAvatarIdState(event.detail.avatarId);
      }
    };

    window.addEventListener(guestAvatarChangeEvent, handleAvatarChange);

    return () => {
      window.removeEventListener(guestAvatarChangeEvent, handleAvatarChange);
    };
  }, []);

  /**
   * Stores a valid avatar id in local UI preference state only.
   */
  const setSelectedAvatarId = (avatarId) => {
    const nextAvatarId = guestAvatarOptions.some(
      (avatar) => avatar.id === avatarId
    )
      ? avatarId
      : defaultGuestAvatarId;

    setSelectedAvatarIdState(nextAvatarId);
    storeAvatarId(nextAvatarId);
  };

  return {
    avatarOptions: guestAvatarOptions,
    selectedAvatar: getGuestAvatarOption(selectedAvatarId),
    selectedAvatarId,
    setSelectedAvatarId,
  };
}
