// Generates a stable per-browser visitor session id, stored in localStorage.
const KEY = "azgallery_session";

function createVisitorSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `v_${crypto.randomUUID().replaceAll("-", "")}`;
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
    return `v_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }

  return `v_${Math.random().toString(36).slice(2, 18)}${Date.now().toString(36)}`;
}

function isValidVisitorSession(value: string | null): value is string {
  return !!value && /^v_[a-z0-9]{10,40}$/i.test(value);
}

export function getVisitorSession(): string {
  if (typeof window === "undefined") return "v_ssr0000000000";
  const existing = localStorage.getItem(KEY);
  if (isValidVisitorSession(existing)) return existing;

  const next = createVisitorSessionId();
  localStorage.setItem(KEY, next);
  return next;
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
