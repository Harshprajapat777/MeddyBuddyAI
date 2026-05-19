const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

let token = localStorage.getItem("mb_token");

export function getToken() {
  return token;
}

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("mb_token", t);
  else localStorage.removeItem("mb_token");
}

export function clearToken() {
  setToken(null);
}

class ApiError extends Error {
  constructor(message, payload) {
    super(message);
    this.name = "ApiError";
    this.payload = payload;
  }
}

async function request(path, body = {}, { method = "POST", auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; }
  catch (e) { throw new ApiError(`Bad JSON from ${path}`, text); }

  // Top-level "Unauthorized" (legacy unwrapped shape)
  if (json?.error === "Unauthorized") {
    clearToken();
    throw new ApiError("Unauthorized", json);
  }
  // New envelope: { ok:false, error:{code, message} }
  if (json?.ok === false) {
    const err = json.error;
    const msg = typeof err === "string"
      ? err
      : (err?.message ?? err?.code ?? "Request failed");
    if (err?.code === "UNAUTHORIZED") {
      clearToken();
    }
    throw new ApiError(msg, json);
  }
  // Walker-level error inside data.error (Jac runtime exceptions)
  if (json?.data?.error) {
    const e = json.data.error;
    const msg = typeof e === "string" ? e : (e?.message ?? "Walker error");
    throw new ApiError(msg, json);
  }

  // Walker calls have data.reports[0]; auth calls have data directly.
  return json?.data?.reports?.[0] ?? json?.data ?? json;
}

export const api = {
  // ─── Auth ──────────────────────────────────────────────────────────────
  register: (username, password) =>
    request("/user/register", {
      identities: [{ type: "username", value: username }],
      credential: { type: "password", password },
    }, { auth: false }),

  login: (username, password) =>
    request("/user/login", {
      identity: { type: "username", value: username },
      credential: { type: "password", password },
    }, { auth: false }),

  // ─── Profile ───────────────────────────────────────────────────────────
  initUser: (user_name = "User", email = "", timezone = "Asia/Kolkata") =>
    request("/walker/init_user", { user_name, email, timezone }),

  getProfile: () => request("/walker/get_profile"),

  updateProfile: (patch) => request("/walker/update_profile", patch),

  // ─── Medication CRUD ───────────────────────────────────────────────────
  addMedication: (med_name, dosage, frequency = "daily", times = ["08:00"], notes = "") =>
    request("/walker/add_medication", { med_name, dosage, frequency, times, notes }),

  getMedications: (include_inactive = false) =>
    request("/walker/get_medications", { include_inactive }),

  logDose: (med_name, status = "taken", note = "") =>
    request("/walker/log_dose", { med_name, status, note }),

  getDoseHistory: (med_name = "", limit = 50) =>
    request("/walker/get_dose_history", { med_name, limit }),

  deactivateMedication: (med_name) =>
    request("/walker/deactivate_medication", { med_name }),

  getAdherence: (med_name = "", days = 7) =>
    request("/walker/get_adherence", { med_name, days }),

  // ─── Chat (LLM agent) ──────────────────────────────────────────────────
  chat: (user_message) => request("/walker/meddy_chat", { user_message }),
  clearChat: () => request("/walker/clear_chat_history", {}),

  // ─── Onboarding agent (focused med-setup chat for first-time users) ────
  onboardingChat: (user_message) =>
    request("/walker/onboarding_chat", { user_message }),
  clearOnboarding: () => request("/walker/clear_onboarding_history", {}),

  // ─── Digital Twin ──────────────────────────────────────────────────────
  healthScore: () => request("/walker/health_score", {}),
  getAlerts: (include_acknowledged = false) =>
    request("/walker/get_alerts", { include_acknowledged }),
  generateAlerts: () => request("/walker/generate_alerts", {}),
  acknowledgeAlert: (alert_id) =>
    request("/walker/acknowledge_alert", { alert_id }),
  weeklyReport: () => request("/walker/weekly_report", {}),

  // ─── Brevo email layer (proactive reminders + caregiver digest) ────────
  sendTestEmail: (to_email = "") =>
    request("/walker/send_test_email", { to_email }),
  sendReminder: (med_name) =>
    request("/walker/send_reminder", { med_name }),
  sendCaregiverDigest: () =>
    request("/walker/send_caregiver_digest", {}),
};

export { ApiError };
