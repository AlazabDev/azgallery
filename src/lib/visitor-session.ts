// Generates a stable per-browser visitor session id, stored in localStorage.
const KEY = "azgallery_session";

export function getVisitorSession(): string {
  if (typeof window === "undefined") return "ssr";
  let s = localStorage.getItem(KEY);
  if (!s) {
    s =
      "v_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36);
    localStorage.setItem(KEY, s);
  }
  return s;
}

const NAME_KEY = "azgallery_name";
const PHONE_KEY = "azgallery_phone";

export function getStoredVisitor() {
  if (typeof window === "undefined") return { name: "", phone: "" };
  return {
    name: localStorage.getItem(NAME_KEY) ?? "",
    phone: localStorage.getItem(PHONE_KEY) ?? "",
  };
}

export function saveVisitor(name: string, phone: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
  if (phone) localStorage.setItem(PHONE_KEY, phone);
}
