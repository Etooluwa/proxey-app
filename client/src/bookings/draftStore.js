const STORAGE_KEY = "proxey.booking.draft";

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("[booking] Failed to read draft", error);
    return null;
  }
}

export function saveDraft(draft) {
  try {
    if (!draft) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn("[booking] Failed to persist draft", error);
  }
}

export function clearDraft() {
  window.localStorage.removeItem(STORAGE_KEY);
}
